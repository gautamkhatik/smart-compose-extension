const { Configuration, OpenAIApi } = require('openai');
import { SSE } from 'sse.js';

let apiKey;
let openaiClient;

// Load API key from chrome local storage
chrome.storage.local.get(['openaiApiKey']).then(({ openaiApiKey }) => {
  const configuration = new Configuration({
    apiKey: openaiApiKey,
  });
  openaiClient = new OpenAIApi(configuration);
  apiKey = openaiApiKey;
});

// Add listener for API key changes and update OpenAI configuration on changes
chrome.storage.onChanged.addListener((changes) => {
  for (let [key, { newValue }] of Object.entries(changes)) {
    if (key !== 'openaiApiKey') continue;
    openaiClient = new OpenAIApi(
      new Configuration({
        apiKey: newValue,
      })
    );
  }
});

setInterval(() => {
  const gmailForms = document.querySelectorAll('div[g_editable]');
  for (const form of gmailForms) {
    if (
      form.parentNode &&
      form.parentNode.querySelector('#email-assistant-button') == null
    ) {
      attachAssistantButton(form);
    }
  }
}, 1000);


function attachAssistantButton(node) {

      node.insertAdjacentHTML(
    'beforebegin',
    `<div id="email-assistant-button" class="assistant-btn">
          <svg class="assistant-btn-inner" viewBox="0 0 24 24">
              <path fill="#232323" d="M19,1L17.74,3.75L15,5L17.74,6.26L19,9L20.25,6.26L23,5L20.25,3.75M9,4L6.5,9.5L1,12L6.5,14.5L9,20L11.5,14.5L17,12L11.5,9.5M19,15L17.74,17.74L15,19L17.74,20.25L19,23L20.25,20.25L23,19L20.25,17.74" />
          </svg>
      </div>`
  );
  
    // add click event listener to assistant button
    node.parentNode
      .querySelector('#email-assistant-button')
      .addEventListener('click', async function () {
      
      // build the SSE request
      const sse = new SSE('https://api.openai.com/v1/completions', {
        headers: {
          Authorization: 'Bearer ' + apiKey,
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify({
          model: 'text-davinci-003',
          prompt:
            'Continue writing the following email:\n"' + node.textContent + '"',
          temperature: 0.6,
          max_tokens: 1024,
          stream: true,
        }),
        method: 'POST',
      });
      
      // handle server sent messages
      sse.addEventListener('message', function (res) {
        if (res.data === '[DONE]') {
          sse.close();
          return;
        }
      
        // res.data is now a string, so we have to parse it into a JSON object
        node.textContent += JSON.parse(res.data).choices[0].text;
      });
      
      // handle server sent error messages, simply print them out, not much we can do about them
      sse.addEventListener('error', (err) =>
        console.error('Completion action SSE error: ', err)
      );
      
      // this opens the connection with the server, i.e. sends the request
      sse.stream();
  
    });
  }




// function attachAssistantButton(node) {
//   // attach assistant button
//   node.insertAdjacentHTML(
//     'beforebegin',
//     `<div id="email-assistant-button" class="assistant-btn">
//           <svg class="assistant-btn-inner" viewBox="0 0 24 24">
//               <path fill="#232323" d="M19,1L17.74,3.75L15,5L17.74,6.26L19,9L20.25,6.26L23,5L20.25,3.75M9,4L6.5,9.5L1,12L6.5,14.5L9,20L11.5,14.5L17,12L11.5,9.5M19,15L17.74,17.74L15,19L17.74,20.25L19,23L20.25,20.25L23,19L20.25,17.74" />
//           </svg>
//       </div>`
//   );

//   node.parentNode
//     .querySelector('#email-assistant-button')
//     .addEventListener('click', async function () {
//     //   if (!openaiClient) return;

//     //   // 1. fetch the completion for the email content
//     //   const completion = await openaiClient.createCompletion({
//     //     model: 'text-davinci-003',
//     //     prompt:
//     //       // 2. we explain exactly what we want (continue writing the email)
//     //       // and provide context (the current email content)
//     //       'Continue writing the following email:\n"' + node.textContent + '"',

//     //     // 3. reduced the temperature a little for better consistency (optional)
//     //     temperature: 0.6,
//     //     max_tokens: 1024,
//     //   });

//     //   // 4. once the request is finished, we append the completion text to the existing email text
//     //   node.textContent += ' ' + completion.data.choices[0].text;
//     });
// }
