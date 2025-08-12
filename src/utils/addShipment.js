export async function addShipment({ item_id, quantity, note }) {
  try {
    const response = await fetch('/api/tracking/add-shipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: parseInt(item_id),
        quantity: parseInt(quantity),
        note: note || null
      })
    });
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { success: false, error: 'API endpoint not found.' };
    }
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.error || 'Unknown error' };
    }
  } catch (error) {
    return { success: false, error: error.message || 'Network error' };
  }
}
