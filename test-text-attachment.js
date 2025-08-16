// Test different text attachment scenarios
console.log('🧪 Testing Text Attachment Scenarios\n');

// Simulate text attachment logic
function calculateHorizontalOverlap(box1, box2) {
  const left = Math.max(box1.x, box2.x);
  const right = Math.min(box1.x + box1.width, box2.x + box2.width);
  const overlap = Math.max(0, right - left);
  const minWidth = Math.min(box1.width, box2.width);
  return overlap / minWidth;
}

function findTextAttachment(textElement, rectangleElement) {
  // Check if text is just above the rectangle (title text)
  const titleThreshold = 20; // pixels
  
  const distanceAbove = rectangleElement.y - (textElement.y + textElement.height);
  const horizontalOverlap = calculateHorizontalOverlap(textElement, rectangleElement);
  
  console.log(`Text position: (${textElement.x}, ${textElement.y}) ${textElement.width}x${textElement.height}`);
  console.log(`Rectangle position: (${rectangleElement.x}, ${rectangleElement.y}) ${rectangleElement.width}x${rectangleElement.height}`);
  console.log(`Distance above: ${distanceAbove}px`);
  console.log(`Horizontal overlap: ${(horizontalOverlap * 100).toFixed(1)}%`);
  
  if (distanceAbove > 0 && distanceAbove <= titleThreshold && horizontalOverlap > 0.5) {
    return {
      attachmentType: 'title',
      confidence: 0.8,
      reason: 'Text positioned above rectangle with good overlap'
    };
  }
  
  return {
    attachmentType: 'standalone',
    confidence: 1.0,
    reason: 'Text not positioned as title'
  };
}

// Test case 1: Text directly above rectangle (should work)
console.log('📋 Test 1: Text directly above rectangle');
const text1 = { x: 100, y: 80, width: 150, height: 20 };
const rect1 = { x: 100, y: 110, width: 200, height: 100 };
const attachment1 = findTextAttachment(text1, rect1);
console.log(`Result: ${attachment1.attachmentType} (${attachment1.reason})\n`);

// Test case 2: Text too far above rectangle (won't work)
console.log('📋 Test 2: Text too far above rectangle');
const text2 = { x: 100, y: 50, width: 150, height: 20 };
const rect2 = { x: 100, y: 110, width: 200, height: 100 };
const attachment2 = findTextAttachment(text2, rect2);
console.log(`Result: ${attachment2.attachmentType} (${attachment2.reason})\n`);

// Test case 3: Text with poor horizontal overlap (won't work)
console.log('📋 Test 3: Text with poor horizontal overlap');
const text3 = { x: 300, y: 80, width: 150, height: 20 };
const rect3 = { x: 100, y: 110, width: 200, height: 100 };
const attachment3 = findTextAttachment(text3, rect3);
console.log(`Result: ${attachment3.attachmentType} (${attachment3.reason})\n`);

console.log('💡 For widget detection to work:');
console.log('1. Text should be within 20px above the rectangle');
console.log('2. Text should have >50% horizontal overlap with rectangle');
console.log('3. OR text should be directly ON the rectangle (rectangle.text property)');
console.log('\n🎯 In Excalidraw:');
console.log('- Double-click rectangle and type text (sets rectangle.text)');
console.log('- OR use text tool and position text directly above rectangle');