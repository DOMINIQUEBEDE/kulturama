export function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatPhone(phone) {
  // Format for CI: +225 XX XX XXX XXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('225')) {
    const num = cleaned.slice(3);
    return `+225 ${num.slice(0, 2)} ${num.slice(2, 4)} ${num.slice(4, 7)} ${num.slice(7)}`;
  }
  return phone;
}

export const ORDER_STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  delivered: 'Livrée',
  cancelled: 'Annulée'
};

export const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

export const PAYMENT_METHOD_LABELS = {
  cash: 'Paiement livraison',
  orange_money: 'Orange Money',
  mtn_momo: 'MTN MoMo',
  wave: 'Wave'
};
