const axios = require('axios');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

const headers = {
    Authorization: `Bearer ${NOTION_TOKEN}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
};

const createPage = async (properties) => {
    const response = await axios.post(
        'https://api.notion.com/v1/pages',
        {
            parent: { database_id: DATABASE_ID },
            properties,
        },
        { headers }
    );
    return response.data;
};

const updatePage = async (pageId, properties) => {
    const response = await axios.patch(
        `https://api.notion.com/v1/pages/${pageId}`,
        { properties },
        { headers }
    );
    return response.data;
};

const archivePage = async (pageId) => {
    await axios.patch(
        `https://api.notion.com/v1/pages/${pageId}`,
        { archived: true },
        { headers }
    );
};

const fetchAllPages = async () => {
    const response = await axios.post(
        `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
        {},
        { headers }
    );
    return response.data.results;
};

module.exports = {
    createPage,
    updatePage,
    archivePage,
    fetchAllPages
};
