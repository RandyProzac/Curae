-- Update payments table
UPDATE payments SET method = 'EFECTIVO' WHERE lower(method) = 'efectivo';
UPDATE payments SET method = 'VISA' WHERE lower(method) LIKE '%tarjeta%';
UPDATE payments SET method = 'BCP' WHERE lower(method) LIKE '%yape%';
UPDATE payments SET method = 'INTERBANK' WHERE lower(method) LIKE '%transferencia%';
UPDATE payments SET method = 'BBVA' WHERE lower(method) LIKE '%bbva%';

-- Update expenses table
UPDATE expenses SET payment_method = 'EFECTIVO' WHERE lower(payment_method) = 'efectivo';
UPDATE expenses SET payment_method = 'VISA' WHERE lower(payment_method) LIKE '%tarjeta%';
UPDATE expenses SET payment_method = 'BCP' WHERE lower(payment_method) LIKE '%yape%';
UPDATE expenses SET payment_method = 'INTERBANK' WHERE lower(payment_method) LIKE '%transferencia%';
UPDATE expenses SET payment_method = 'BBVA' WHERE lower(payment_method) LIKE '%bbva%';
