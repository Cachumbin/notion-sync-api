const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

app.post('/sync', async (req, res) => {
    const { name, done, dueDate, reminderId } = req.query;

    if (!name || !reminderId) {
        return res.status(400).json({ error: 'Missing required fields: name and reminderId' });
    }

    try {
        const response = await axios.post(
            'https://api.notion.com/v1/pages',
            {
                parent: { database_id: DATABASE_ID },
                properties: {
                    title: { title: [{ text: { content: name } }] },
                    Done: { checkbox: done === 'true' },
                    Due: dueDate ? { date: { start: dueDate } } : undefined,
                    ID: { rich_text: [{ text: { content: reminderId } }] },
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${NOTION_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28',
                },
            }
        );

        res.status(200).json({ success: true, pageId: response.data.id });
    } catch (error) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
});


app.get('/pages', async (req, res) => {
    try {
        const response = await axios.post(
            'https://api.notion.com/v1/databases/' + DATABASE_ID + '/query',
            {},
            {
                headers: {
                    Authorization: `Bearer ${NOTION_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28',
                },
            }
        );

        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

app.get('/tasks', async (req, res) => {
    try {
        const response = await axios.post(
            `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${NOTION_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28',
                },
            }
        );

        const tasks = response.data.results.map(page => ({
            name: page.properties.Name?.title?.[0]?.text?.content || '',
            done: page.properties.Done?.checkbox || false,
            dueDate: page.properties.Due?.date?.start || null,
            reminderId: page.properties.ID?.rich_text?.[0]?.text?.content || '',
        }));

        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
});


app.post('/syncFromReminders', async (req, res) => {
    const reminders = req.body.reminders;

    if (!Array.isArray(reminders)) {
        return res.status(400).json({ error: 'Reminders must be an array' });
    }

    try {
        const notionResponse = await axios.post(
            `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${NOTION_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28',
                },
            }
        );

        const notionTasks = notionResponse.data.results.map(page => ({
            pageId: page.id,
            name: page.properties.title?.title[0]?.text?.content || '',
            done: page.properties.Done?.checkbox || false,
            dueDate: page.properties.Due?.date?.start || null,
            reminderId: page.properties.ID?.rich_text[0]?.text?.content || '',
        }));

        const actions = [];

        const notionMap = new Map(notionTasks.map(task => [task.reminderId, task]));
        const remindersMap = new Map(reminders.map(task => [task.reminderId, task]));

        for (const reminder of reminders) {
            const { name, done, dueDate, reminderId } = reminder;
            const existing = notionMap.get(reminderId);

            if (!existing) {
                const createResponse = await axios.post(
                    'https://api.notion.com/v1/pages',
                    {
                        parent: { database_id: DATABASE_ID },
                        properties: {
                            title: { title: [{ text: { content: name } }] },
                            Done: { checkbox: done === true },
                            Due: dueDate ? { date: { start: dueDate } } : undefined,
                            ID: { rich_text: [{ text: { content: reminderId } }] },
                        },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${NOTION_TOKEN}`,
                            'Content-Type': 'application/json',
                            'Notion-Version': '2022-06-28',
                        },
                    }
                );
                actions.push({ reminderId, action: 'created', pageId: createResponse.data.id });
            } else {
                if (existing.name !== name || existing.done !== done || existing.dueDate !== dueDate) {
                    await axios.patch(
                        `https://api.notion.com/v1/pages/${existing.pageId}`,
                        {
                            properties: {
                                title: { title: [{ text: { content: name } }] },
                                Done: { checkbox: done === true },
                                Due: dueDate ? { date: { start: dueDate } } : undefined,
                                ID: { rich_text: [{ text: { content: reminderId } }] },
                            },
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${NOTION_TOKEN}`,
                                'Content-Type': 'application/json',
                                'Notion-Version': '2022-06-28',
                            },
                        }
                    );
                    actions.push({ reminderId, action: 'updated', pageId: existing.pageId });
                }
            }
        }

        for (const notionTask of notionTasks) {
            if (!remindersMap.has(notionTask.reminderId)) {
                await axios.patch(
                    `https://api.notion.com/v1/pages/${notionTask.pageId}`,
                    { archived: true },
                    {
                        headers: {
                            Authorization: `Bearer ${NOTION_TOKEN}`,
                            'Content-Type': 'application/json',
                            'Notion-Version': '2022-06-28',
                        },
                    }
                );
                actions.push({ reminderId: notionTask.reminderId, action: 'deleted', pageId: notionTask.pageId });
            }
        }

        res.status(200).json({ success: true, actions });

    } catch (error) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
});


app.listen(3000, () => {
    console.log('Server running on port 3000');
});