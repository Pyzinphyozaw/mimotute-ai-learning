async function getBookDifficulty(title, description) {
  try {
    const response = await fetch('http://127.0.0.1:5000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: title, description: description })
    });

    const data = await response.json();
    console.log('Predicted Difficulty:', data.difficulty);
    return data.difficulty;
  } catch (error) {
    console.error('Error connecting to prediction model:', error);
  }
}

// Example usage:
getBookDifficulty(
  'Advanced React Architecture', 
  'Deep dive into fiber reconciliation, performance optimization, and custom concurrency patterns.'
);