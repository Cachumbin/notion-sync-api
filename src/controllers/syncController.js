const { createPage, updatePage, archivePage, fetchAllPages } = require('../utils/notionClient');
const moment = require('moment');

const getReminders = async (req, res) => {
    try {
        const notionTasks = await fetchAllPages();

        const reminders = notionTasks.map(task => ({
            name: task.properties.Name?.title?.[0]?.text?.content || '',
            done: task.properties.Done?.checkbox || false,
            dueDate: task.properties.Due?.date?.start || null,
            reminderId: task.properties.ID?.rich_text?.[0]?.text?.content || ''
        }));

        res.status(200).json({ reminders });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message });
    }
};

const syncNotion = async (req, res) => {
    try {
        const rawData = req.body.data || req.body;

        if (!rawData) {
            return res.status(400).json({ error: 'No event data received' });
        }

        const events = rawData.split("END:VEVENT").filter(e => e.trim() !== '');

        const parsedReminders = events.map(event => {
            const summaryMatch = event.match(/SUMMARY:(.*)/);
            const dueDateMatch = event.match(/DUEDATE:(.*)/);
            const completedMatch = event.match(/COMPLETED:(.*)/);

            if (!summaryMatch) return null;

            const name = summaryMatch[1].trim();
            if (!name) return null;

            const done = completedMatch ? completedMatch[1].trim().toLowerCase() === 'yes' : false;
            const dueDate = dueDateMatch ? moment(dueDateMatch[1].trim(), "DD/MM/YYYY [at] hh:mm A").toISOString() : null;
            const reminderId = name.toLowerCase().replace(/ /g, '-');

            return {
                name,
                done,
                dueDate,
                reminderId
            };
        }).filter(event => event !== null);

        const notionTasks = await fetchAllPages();
        const notionMap = new Map(notionTasks.map(task => [
            task.properties.Name?.title?.[0]?.text?.content.toLowerCase(),
            task
        ]));

        const actions = [];
        const textReminderIds = new Set(parsedReminders.map(r => r.name.toLowerCase()));

        for (const reminder of parsedReminders) {
            const { name, done, dueDate, reminderId } = reminder;
            const existing = notionMap.get(name.toLowerCase());

            const properties = {
                title: { title: [{ text: { content: name } }] },
                Done: { checkbox: done },
                Due: dueDate ? { date: { start: dueDate } } : undefined,
                ID: { rich_text: [{ text: { content: reminderId } }] },
            };

            if (existing) {
                await updatePage(existing.id, properties);
                actions.push({ reminderId, action: 'updated', pageId: existing.id });
            } else {
                const response = await createPage(properties);
                actions.push({ reminderId, action: 'created', pageId: response.id });
            }
        }

        for (const [name, notionTask] of notionMap) {
            if (!textReminderIds.has(name)) {
                await archivePage(notionTask.id);
                actions.push({ reminderId: name.toLowerCase().replace(/ /g, '-'), action: 'deleted', pageId: notionTask.id });
            }
        }

        res.status(200).json({ success: true, actions });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    syncNotion,
    getReminders
};
