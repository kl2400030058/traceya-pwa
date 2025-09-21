export const savePendingRegistration = (farmer: { id: string; name: string; phone: string }) => {
  const pending = JSON.parse(localStorage.getItem('pending_reg') || '[]');
  pending.push({ ...farmer, timestamp: Date.now() });
  localStorage.setItem('pending_reg', JSON.stringify(pending));
};

export const getPendingRegistrations = () => JSON.parse(localStorage.getItem('pending_reg') || '[]');

export const clearPendingRegistration = (farmerId: string) => {
  const pending = getPendingRegistrations().filter((f: any) => f.id !== farmerId);
  localStorage.setItem('pending_reg', JSON.stringify(pending));
};