export class ChatBot {

constructor(){
    this.chatMessages = document.querySelector("#chatDiv");
    this.instructDoc = '' ;
    this.socket = io();
    this.article =`Article #22640 - "Check front turn signal bulb"
    alert, with improper output from switchpack
    Description
    "Check left/right front turn signal bulb" alert, with improper output from switchpack.
    Steps to Test
    Check fuse 7.
    Measure the voltage at the turn signal switch connector (Left FHC9 - pin 49AL)(Right FHC9 - pin 49AR).
    Bridge the appropriate terminals to bypass the turn signal switch.
    Steps to Fix
    Replace the fuse if damaged.
    If the voltage does not equal 12V, check/repair the wiring/connectors.
    If the signal operates while bypassing the turn signal switch, replace the switch (Part# 2000253). Otherwise,
    check/repair the wiring/connectors.
    Possible Effects
    Article #21636 SWP 537 Check left front turn signal bulb
    Article #21638 SWP 539 Check right front turn signal bulb
    Possible Causes `;
};


async feedInput(cvResult, snipImage){
  console.log('input text', cvResult)
    const resultImage = await this.addBoundingBox(snipImage,cvResult) 
    const resultTable = this.markdown(cvResult)
   // this.addText('user', resultTable);
    this.addImage("user", resultImage)
    this.addText('bot', '...');
    const queryText = "according to wi-320 work instructions, what are the work process involving below parts? how should Operator do with them? Below are these parts: "+cvResult

    try {
      const response = await this.callLangChain(queryText);
      this.addText('bot', response.text);
      const event = new Event('receivedGPTResponse')
      window.dispatchEvent(event);
     } catch (error) {
      console.log('There was a problem with the fetch operation:', error.message);
     }
}

async callLangChain(queryText) {
  try {
      const response = await fetch('/openai', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: queryText }),
      });
      
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch data from the server.');
      }
      console.log('--bot response--?-', response.message)
      return await response.json();
  } catch (error) {
      throw new Error('An error occurred: ' + error.message);
  }
}

async startNewChat(codeId) {
// const queryText = `hey Joe, I am starting a new Lot #${codeId}. Please provide State Diagram for #22637.`;
 
const queryText = `SOURCE: """ ${this.article}""" please enerate OUTPUT BLOCK text.`;
  this.addText('user', queryText);
  this.addText('bot', '...');

  try {
      const response = await this.callLangChain(queryText);
      console.log('bot--- ')
      console.log('bot response: ', response)

      this.addText('bot', response.text);

      const event = new Event('receivedGPTResponse')
      window.dispatchEvent(event);
  } catch (error) {
      console.log('There was a problem with the fetch operation:', error.message);
  }
}


addText(sender, queryText) {
  console.log('mdRes ',queryText)
  const emoji = sender === 'bot' ? "👌" : "&#9986;";
  let containerElement;
  
const uml =
`==== BEGIN DIAGRAM OUTPUT ====
[<table>#22637]
[<start>start] -> [<state>Steps to Test] -> [<state>Steps to Fix] 
[<start>start] -> [<state>Steps to Fix] ->[<choice>If Light On] -> [<state>something]
[<choice>If Light On]->[<end>]
[<table>#22638]
`

  // Check if the #tempContainer element exists
  const tempContainer = document.querySelector("#tempContainer");

  if (sender === 'bot') {
    // If sender is 'bot', use tempContainer if it exists, otherwise create a new one
    containerElement = tempContainer ? tempContainer : document.createElement("div");
    containerElement.id = "tempContainer"
    // Clear the content of the container
    containerElement.innerHTML = "";
    containerElement.className = "talk-bubble tri-right left-in"; // Added this line
  } else {
    // If sender is not 'bot', remove the id from tempContainer if it exists
    if (tempContainer) {
      tempContainer.removeAttribute("id");
    }
    // Create a new container element
    containerElement = document.createElement("div");
    containerElement.className = "talk-bubble tri-right"; // Added this line
    containerElement.style.cssText = "background-color: transparent; border: 1px solid grey;";
  }

  const talkText = document.createElement("div"); // Added this line
  talkText.className = "talktext"; // Added this line
  talkText.innerHTML = `<span class="emoji-styling">${emoji}</span>`;
  containerElement.appendChild(talkText); // Added this line

  const parsedContent = this.commitParser(queryText)
  const chatMessage = this.markupChatMessage(parsedContent)
  containerElement.appendChild(chatMessage)

  this.chatMessages.appendChild(containerElement);
  this.chatMessages.appendChild(document.createElement("br"));
  this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

  this.addTextConsole(sender, parsedContent);

}
commitParser(content) {
  const results = [];
  const sections = content.split('==== END DIAGRAM ====').map(s => s.trim());

  sections.forEach(section => {
      if (section.includes('==== BEGIN DIAGRAM ====')) {
          const diagramContent = section.split('==== BEGIN DIAGRAM ====').pop().trim();
          results.push({ type: 'diagram', content: diagramContent });
          
          const textContentBeforeDiagram = section.split('==== BEGIN DIAGRAM ====').shift().trim();
          if (textContentBeforeDiagram) {
              results.unshift({ type: 'text', content: textContentBeforeDiagram });
          }
      } else if (section) {
          results.push({ type: 'text', content: section });
      }
  });

  return results;
}


markupChatMessage(parsedContent) {
  const chatContainer = document.createElement('div');

  parsedContent.forEach(item => {
      const element = document.createElement(item.type === 'text' ? 'div' : 'canvas');
      if (item.type === 'text') {
          element.innerText = item.content;
      } else {
          element.style.display = "block";  // Set canvas to block
          element.style.margin = "auto";    // Center it horizontally
          nomnoml.draw(element, item.content);
      }
      chatContainer.appendChild(element);
  });

  return chatContainer;
}

markdown(result) {
  const { time, tag, probability } = result;
  const formattedTime = new Date(time).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
  });

  const mdContent =
  `
|result|content |
|--|--|
| time | ${formattedTime} |
| tag | ${tag}|
| confidence | ${probability}% |
  `
  return mdContent

}

async addBoundingBox(imageBlob, result) {
    const { predictions } = result;
    const resultImage = new Image();
    resultImage.src = URL.createObjectURL(imageBlob);
  
    // Wait for the image to load
    await new Promise(resolve => {
      resultImage.onload = resolve;
    });
  
    const originalWidth = resultImage.width;
    const originalHeight = resultImage.height;
  
    // Create a canvas and draw the loaded image
    const canvas = document.createElement('canvas');
    canvas.width = originalWidth;
    canvas.height = originalHeight + predictions.length * 100; // Adjust canvas height for multiple predictions
    const ctx = canvas.getContext('2d');
    ctx.drawImage(resultImage, 0, 0, originalWidth, originalHeight);
  
    // Iterate through predictions and draw bounding boxes
    predictions.forEach((prediction, index) => {
      const { boundingBox, tag, probability } = prediction;
  
      // Convert relative bounding box coordinates to pixel values
      const x = boundingBox.left * originalWidth;
      const y = boundingBox.top * originalHeight;
      const width = boundingBox.width * originalWidth;
      const height = boundingBox.height * originalHeight;
  
      // Draw bounding box
      ctx.strokeStyle = 'red'; // Set the stroke color to red
      ctx.lineWidth = 2; // Set the line width as desired
  
      ctx.beginPath();
      ctx.rect(x, y, width, height); // Adjust y-coordinate for each prediction
      ctx.closePath(); // Close the path
      ctx.stroke(); // Stroke the path to draw the box
  
      // Adjust text placement for each prediction
      ctx.font = '16px Arial'; // You can customize the font and size
      ctx.fillStyle = 'red'; // You can change the text color
      ctx.fillText(`Tag: ${tag}`, 5, originalHeight + 15 + index * 40); // Adjust text placement
      ctx.fillText(`Probability: ${probability}%`, 5, originalHeight + 35 + index * 40); // Adjust text placement
    });
  
    const annotatedImage = new Image();
    annotatedImage.src = canvas.toDataURL('image/png');
    console.log('addBoundingBox**7');
    return annotatedImage;
  }

  addImage(sender, image) {
    const imgElement = document.createElement('img');
    imgElement.src = image.src; 
        // Style for horizontal centering
        imgElement.style.display = 'block';  // Block display to occupy full width
        imgElement.style.marginLeft = 'auto';  // Automatic left margin
        imgElement.style.marginRight = 'auto';  // Automatic right margin
    this.chatMessages.appendChild(imgElement);  
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  addTextConsole(sender, parsedContent){
    const stationId = document.getElementById('gridText').textContent;

    const log = {
      gridId: stationId,
      sender: sender,
      content: parsedContent  
    };

    this.socket.emit('botLog', log);
}


}