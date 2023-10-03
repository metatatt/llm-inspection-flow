self.addEventListener('message', async event => {
  console.log('cvResult***-1, worker')
  const { imageBlob, cvServiceCredentials } = event.data;
  const { keyContain, endConnect, probability } = cvServiceCredentials;

  const formData = new FormData();
  formData.append('image', imageBlob, 'image.png');
  console.log('iter: ', endConnect)
  console.log('key: ', keyContain)

  const predictionResponse = await fetch(endConnect, {
    method: 'POST',
    body: formData,
    headers: {
      'Prediction-Key': keyContain,
    },
  });

  const predictionResult = await predictionResponse.json();
  console.log('predict result**', predictionResult)
  const removeDuplicates = (predictions, overlapThreshold = 0.5) => {
    // Sort predictions by probability in descending order
    predictions.sort((a, b) => b.probability - a.probability);

    // Create a list to store the filtered predictions
    const filteredPredictions = [];

    for (const prediction of predictions) {
      // Check for overlap with previous predictions
      let isDuplicate = false;

      for (const prevPrediction of filteredPredictions) {
        // Calculate the intersection over union (IoU) of bounding boxes
        const intersectionLeft = Math.max(prediction.boundingBox.left, prevPrediction.boundingBox.left);
        const intersectionTop = Math.max(prediction.boundingBox.top, prevPrediction.boundingBox.top);
        const intersectionRight = Math.min(
          prediction.boundingBox.left + prediction.boundingBox.width,
          prevPrediction.boundingBox.left + prevPrediction.boundingBox.width
        );
        const intersectionBottom = Math.min(
          prediction.boundingBox.top + prediction.boundingBox.height,
          prevPrediction.boundingBox.top + prevPrediction.boundingBox.height
        );

        const intersectionWidth = Math.max(0, intersectionRight - intersectionLeft);
        const intersectionHeight = Math.max(0, intersectionBottom - intersectionTop);
        const intersectionArea = intersectionWidth * intersectionHeight;

        const predictionArea = prediction.boundingBox.width * prediction.boundingBox.height;
        const prevPredictionArea = prevPrediction.boundingBox.width * prevPrediction.boundingBox.height;
        const unionArea = predictionArea + prevPredictionArea - intersectionArea;

        const iou = intersectionArea / unionArea;

        // If IoU is greater than the threshold, consider it a duplicate
        if (iou > overlapThreshold) {
          isDuplicate = true;
          break;
        }
      }

      // If it's not a duplicate and meets the probability threshold, add it to the filtered list
      if (!isDuplicate && prediction.probability > probability) {
        filteredPredictions.push({
          tag: prediction.tagName,
          probability: Math.floor(prediction.probability * 100),
          boundingBox: prediction.boundingBox,
        });
      }
    }

    return filteredPredictions;
  };

  let responsePayload = {
    time: new Date().getTime(),
    predictions: [], // Store all predictions that meet the threshold
  };

  if (predictionResult.predictions && Array.isArray(predictionResult.predictions)) {
    responsePayload.predictions = removeDuplicates(predictionResult.predictions);
    console.log('cvResult***-0.5, worker-payload')
  }

  console.log('cvResult***-0.5', responsePayload);
  self.postMessage(responsePayload);
});


