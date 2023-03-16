'use strict';
/**
 * Create comments on social video platforms through AI simulation
 * @module createComments
 * @param {string} title - The title of the video on which you want to create the comment.
 * @param {any} pages
 * @param {any} spinners
 * @param {object} config - Object containing apiKey parameter
 * @returns {any}
 */
const { Configuration, OpenAIApi } = require('openai');

const createComments = async (pages, spinners, title, config) => {
    try {
        const configuration = new Configuration({
          apiKey: config.apiKey,
        });

        const openai = new OpenAIApi(configuration);

        const prompt = `Human: simulate reply to video "${title}" with natural text\nBot: `;
            
        const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: `${prompt}`,
            temperature: 0,
            max_tokens: 3000,
            top_p: 1,
            frequency_penalty: 0.5,
            presence_penalty: 0,
        });

        const comment = response.data.choices[0].text;

        await pages.keyboard.type(comment, { delay: 10 });
        await pages.waitForTimeout(100);
        await pages.keyboard.press('Enter');
        await pages.evaluate(() => document.querySelector('#submit-button').click());
        spinners.update('comment', { text: `Success ${comment}`, color: 'blue' });
        await pages.waitForTimeout(5000);
        
    } catch (error) {
        console.error(`Cannot create comment!\n${error}`);
    }
};

module.exports = { createComments };
