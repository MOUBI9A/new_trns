console.log('Running TestDataGenerator...');
import('./src/js/services/TestDataGenerator.js')
  .then(module => {
    const testDataGenerator = module.default;
    console.log('Test data generator loaded successfully');
    console.log('Generating 10 random matches...');
    const matches = testDataGenerator.generateMatches(10);
    console.log('Generated matches:');
    console.log(JSON.stringify(matches, null, 2));
  })
  .catch(err => console.error('Error loading TestDataGenerator:', err));
