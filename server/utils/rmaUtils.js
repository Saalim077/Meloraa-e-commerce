/**
 * RMA Utility Engine
 * Evaluates rules defined in store settings against a specific order.
 */

const evaluateRule = (order, rule) => {
  if (!rule.active) return true;

  // 1. Check if the rule applies to this order's payment method
  // Normalize payment method to 'cod' or 'online'
  const rawPM = (order.paymentMethod || order.paymentInfo?.method || 'cod').toLowerCase();
  const orderPM = rawPM === 'cod' ? 'cod' : 'online';
  
  const rulePM = (rule.paymentMethod || 'all').toLowerCase();
  
  if (rulePM !== 'all' && rulePM !== orderPM) {
    return true; // Rule doesn't apply to this payment method, so it doesn't block
  }

  const { parameter, operator, value } = rule;
  let orderValue;

  // 2. Extract parameter value from order
  if (parameter === 'Maximum Days') {
    const deliveredAt = order.deliveredAt || order.updatedAt;
    const now = new Date();
    const diffTime = Math.abs(now - new Date(deliveredAt));
    orderValue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else if (parameter === 'Order Statuses') {
    orderValue = order.orderStatus;
  } else {
    return true; // Unknown parameter, ignore
  }

  // 3. Evaluate based on operator
  switch (operator) {
    case 'Less than':
      return orderValue < Number(value);
    case 'Greater than':
      return orderValue > Number(value);
    case 'Equal to':
      if (Array.isArray(value)) {
        return value.some(v => v.toLowerCase() === orderValue.toLowerCase());
      }
      return orderValue.toLowerCase() === value.toLowerCase();
    case 'Not equal to':
      if (Array.isArray(value)) {
        return !value.some(v => v.toLowerCase() === orderValue.toLowerCase());
      }
      return orderValue.toLowerCase() !== value.toLowerCase();
    default:
      return true;
  }
};

/**
 * Checks if an order is eligible for a specific RMA type (return, refund, cancel, exchange)
 * based on the policies defined in settings.
 */
const checkRMAEligibility = (order, type, settings) => {
  // CORE BUSINESS RULE: Return/Exchange only possible for DELIVERED orders.
  // Refund is also allowed for ONLINE PAID orders that are confirmed/processing.
  const isOnlinePaid = (order.paymentMethod !== 'cod') && (order.paymentStatus === 'paid');
  
  if (['return', 'exchange'].includes(type) && order.orderStatus !== 'delivered') {
    return { eligible: false, message: `Only delivered orders are eligible for ${type}.` };
  }

  if (type === 'refund' && order.orderStatus !== 'delivered' && !isOnlinePaid) {
    return { eligible: false, message: `Order must be delivered or paid online for refund eligibility.` };
  }

  const policies = settings.rmaPolicies || [];
  const relevantPolicies = policies.filter(p => p.type === type && p.active);

  // Group policies by parameter to allow "OR" logic for the same parameter (e.g. Status A OR Status B)
  const groupedByParam = relevantPolicies.reduce((acc, p) => {
    if (!acc[p.parameter]) acc[p.parameter] = [];
    acc[p.parameter].push(p);
    return acc;
  }, {});

  for (const parameter in groupedByParam) {
    const rules = groupedByParam[parameter];
    // For statuses, we treat multiple rules as OR (Allow if matches ANY specified status)
    if (parameter === 'Order Statuses') {
      const anyPassed = rules.some(rule => evaluateRule(order, rule));
      if (!anyPassed) {
        return { eligible: false, message: `Status "${order.orderStatus}" is not eligible for ${type}.` };
      }
    } else {
      // For other parameters (like Days), we treat them as AND (All must pass)
      for (const rule of rules) {
        if (!evaluateRule(order, rule)) {
          return { eligible: false, message: `Policy mismatch for ${type}: ${rule.parameter} requirement not met.` };
        }
      }
    }
  }

  return { eligible: true };
};

module.exports = {
  checkRMAEligibility,
  evaluateRule
};

