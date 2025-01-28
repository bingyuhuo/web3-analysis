export async function fetchReport(id: string) {
  const response = await fetch(`/api/get-report?id=${id}`);
  const data = await response.json();
  
  if (data.code === 0 && data.data) {
    if (typeof data.data.content === 'string') {
      try {
        data.data.content = JSON.parse(data.data.content);
      } catch (error) {
        console.error('Failed to parse content:', error);
      }
    }
    return data.data;
  }
  throw new Error('Invalid report data');
}

export async function fetchUserCredits(address: string) {
  const res = await fetch('/api/get-user-credits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });
  const { data } = await res.json();
  return data;
}

export async function checkUserAccess(address: string, reportId: number) {
  const res = await fetch('/api/check-user-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, reportId })
  });
  const data = await res.json();
  return data.code === 0 && data.data?.has_purchased === true;
}

export async function processPayment(address: string, reportId: number) {
  const res = await fetch('/api/consume-credits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      address,
      reportId,
      type: 'view'
    })
  });
  const data = await res.json();
  return {
    success: data.code === 0,
    message: data.message
  };
} 