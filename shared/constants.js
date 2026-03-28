const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

const PAYMENT_METHODS = {
  CASH: 'cash',
  ORANGE_MONEY: 'orange_money',
  MTN_MOMO: 'mtn_momo',
  WAVE: 'wave'
};

const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

const ORDER_STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  delivered: 'Livrée',
  cancelled: 'Annulée'
};

const PAYMENT_METHOD_LABELS = {
  cash: 'Paiement à la livraison',
  orange_money: 'Orange Money',
  mtn_momo: 'MTN MoMo',
  wave: 'Wave'
};

if (typeof module !== 'undefined') {
  module.exports = {
    ORDER_STATUSES,
    PAYMENT_METHODS,
    PAYMENT_STATUSES,
    ORDER_STATUS_LABELS,
    PAYMENT_METHOD_LABELS
  };
}
