import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// DOCTORS
// ============================================
// ============================================
// TREATMENT PLANS
// ============================================
// treatmentPlanApi is defined below with other related APIs

// ============================================
// CLINICAL NOTES (Bitácora de Evolución)
// ============================================
// This section seems to have a syntax error in the original document.
// Assuming it was meant to be a method within an object, or a placeholder.
// Correcting the syntax to be a valid block, or removing if it's just a fragment.
// Given the context, it looks like a fragment of a method that was cut off.
// Removing the malformed fragment.
// Original fragment:
//             .eq('id', id);
// if (error) throw error;
//     }
// };
// This fragment is not part of any valid object or function. Removing it.

// ============================================
// DOCTORS
// ============================================
export const doctorsApi = {
    async getAll() {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .order('name');
        if (error) {
            console.warn('Error fetching doctors:', error);
            return [];
        }
        return data || [];
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            console.warn(`Error fetching doctor ${id}:`, error);
            return null;
        }
        return data;
    },

    async getStats(doctorId) {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { data, error: pError } = await supabase
            .from('appointments')
            .select('patient_id')
            .eq('doctor_id', doctorId)
            .gte('date', startOfMonth);

        if (pError) {
            console.warn('Error fetching doctor stats:', pError);
            return { patientsMonth: 0 };
        }

        // Count unique patients using a Set
        // Filter out null patient_ids just in case
        const uniquePatients = new Set(
            data
                .map(item => item.patient_id)
                .filter(id => id !== null)
        );

        return {
            patientsMonth: uniquePatients.size
        };
    },

    async create(doctor) {
        const { data, error } = await supabase
            .from('doctors')
            .insert(doctor)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('doctors')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('doctors')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};

// ============================================
// PATIENTS (Pacientes)
// ============================================
export const patientsApi = {
    async getAll() {
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .order('last_name');
        if (error) {
            console.warn('Error fetching patients:', error);
            return [];
        }
        return data || [];
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            console.warn(`Error fetching patient ${id}:`, error);
            return null;
        }
        return data;
    },

    async search(query) {
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
            .order('last_name')
            .limit(10);
        if (error) {
            console.warn('Error searching patients:', error);
            return [];
        }
        return data || [];
    },

    async create(patient) {
        const { data, error } = await supabase
            .from('patients')
            .insert(patient)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('patients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('patients')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};

// ============================================
// APPOINTMENTS (Citas)
// ============================================
export const appointmentsApi = {
    async getAll() {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                patient:patients(*),
                doctor:doctors(*)
            `)
            .order('date', { ascending: true });
        if (error) {
            console.warn('Error fetching appointments:', error);
            return [];
        }
        return data || [];
    },

    async getByDateRange(startDate, endDate) {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                patient:patients(*),
                doctor:doctors(*)
            `)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });
        if (error) {
            console.warn('Error fetching appointments by range:', error);
            return [];
        }
        return data || [];
    },

    async getByDoctor(doctorId) {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                patient:patients(*),
                doctor:doctors(*)
            `)
            .eq('doctor_id', doctorId)
            .order('date', { ascending: true });
        if (error) {
            console.warn(`Error fetching appointments for doctor ${doctorId}:`, error);
            return [];
        }
        return data || [];
    },

    async create(appointment) {
        const { data, error } = await supabase
            .from('appointments')
            .insert(appointment)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('appointments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async updateStatus(id, status, updatedBy = 'Usuario') {
        const { data, error } = await supabase
            .from('appointments')
            .update({
                status,
                status_updated_at: new Date().toISOString(),
                status_updated_by: updatedBy
            })
            .eq('id', id)
            .select(`
                *,
                patient:patients(*),
                doctor:doctors(*)
            `)
            .single();
        if (error) throw error;
        return data;
    }
};

// ============================================
// EVENTS (Eventos/Bloqueos)
// ============================================
export const eventsApi = {
    async getAll() {
        const { data, error } = await supabase
            .from('events')
            .select(`
                *,
                doctor:doctors(*)
            `)
            .order('date', { ascending: true });
        if (error) {
            console.warn('Error fetching events:', error);
            return [];
        }
        return data || [];
    },

    async getByDateRange(startDate, endDate) {
        const { data, error } = await supabase
            .from('events')
            .select(`
                *,
                doctor:doctors(*)
            `)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });
        if (error) {
            console.warn('Error fetching events by range:', error);
            return [];
        }
        return data || [];
    },

    async create(event) {
        const { data, error } = await supabase
            .from('events')
            .insert(event)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('events')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};

// ============================================
// SERVICES (Servicios Clínicos)
// ============================================
let _servicesCache = null;
let _servicesCacheTime = 0;
const SERVICES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const servicesApi = {
    async getAll() {
        const now = Date.now();
        if (_servicesCache && (now - _servicesCacheTime) < SERVICES_CACHE_TTL) {
            return _servicesCache;
        }
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('category', { ascending: true })
            .order('name', { ascending: true });
        if (error) {
            console.warn('Error fetching services:', error);
            return _servicesCache || [];
        }
        _servicesCache = data || [];
        _servicesCacheTime = now;
        return _servicesCache;
    },

    async getGroupedByCategory() {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('category')
            .order('name');

        if (error) {
            console.warn('Error fetching services for grouping:', error);
            return {};
        }

        // Group by category
        const grouped = data.reduce((acc, service) => {
            const cat = service.category || 'Sin Categoría';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(service);
            return acc;
        }, {});

        return grouped;
    },

    async create(service) {
        const { data, error } = await supabase
            .from('services')
            .insert(service)
            .select()
            .single();
        if (error) throw error;
        _servicesCache = null; // invalidate cache
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('services')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        _servicesCache = null; // invalidate cache
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);
        if (error) throw error;
        _servicesCache = null;
    }
};

// ============================================
// BUDGETS (Presupuestos por Paciente)
// ============================================
export const budgetsApi = {
    async getByPatient(patientId) {
        const { data, error } = await supabase
            .from('budgets')
            .select(`
                *,
                budget_items (
                    *,
                    payments (*)
                )
            `)
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });
        if (error) {
            console.warn(`Error fetching budgets for patient ${patientId}:`, error);
            return [];
        }
        return data || [];
    },

    async create(budget) {
        const { data, error } = await supabase
            .from('budgets')
            .insert(budget)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('budgets')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Budget Items
    async addItem(item) {
        const { data, error } = await supabase
            .from('budget_items')
            .insert(item)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateItem(id, updates) {
        const { data, error } = await supabase
            .from('budget_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteItem(id) {
        const { error } = await supabase
            .from('budget_items')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};

// ============================================
// PAYMENTS (Pagos)
// ============================================
export const paymentsApi = {
    async create(payment) {
        // 1. Insert payment record
        const { data, error } = await supabase
            .from('payments')
            .insert(payment)
            .select()
            .single();
        if (error) throw error;

        // 2. Update paid_amount on budget_item
        const { data: item } = await supabase
            .from('budget_items')
            .select('paid_amount')
            .eq('id', payment.budget_item_id)
            .single();

        if (item) {
            const newPaid = parseFloat(item.paid_amount || 0) + parseFloat(payment.amount);
            await supabase
                .from('budget_items')
                .update({ paid_amount: newPaid })
                .eq('id', payment.budget_item_id);
        }

        return data;
    },

    async getByBudgetItem(budgetItemId) {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('budget_item_id', budgetItemId)
            .order('created_at', { ascending: false });
        if (error) {
            console.warn(`Error fetching payments for item ${budgetItemId}:`, error);
            return [];
        }
        return data || [];
    }
};

// ============================================
// FINANCE & REPORTS (Finanzas)
// ============================================
export const financeApi = {
    /**
     * Get all payments with patient and budget details
     * Returns flattened structure for reporting
     */
    async getPaymentsWithDetails(startDate = null, endDate = null) {
        let query = supabase
            .from('payments')
            .select(`
                *,
                budget_item:budget_items (
                    id,
                    service_name,
                    budget:budgets (
                        id,
                        title,
                        patient:patients(id, first_name, last_name, dni)
                    )
                )
            `);

        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.warn('Error fetching payments with details:', error);
            return [];
        }

        return data.map(payment => {
            const budget = payment.budget_item?.budget;
            const patient = budget?.patient;

            return {
                id: payment.id,
                amount: parseFloat(payment.amount),
                method: payment.method,
                date: payment.created_at,
                patientName: patient ? `${patient.first_name} ${patient.last_name}` : 'Paciente Eliminado',
                patientDni: patient?.dni,
                patientId: patient?.id,
                budgetId: budget?.id,
                serviceName: payment.budget_item?.service_name || 'Servicio',
                notes: payment.notes
            };
        });
    },

    /**
     * Get total income between dates
     */
    async getIncomeByPeriod(startDate, endDate) {
        let query = supabase
            .from('payments')
            .select('amount');

        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);

        const { data, error } = await query;
        if (error) {
            console.warn('Error fetching income by period:', error);
            return 0;
        }

        return data?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
    },

    /**
     * Get revenue grouped by doctor (Best effort using appointments)
     */
    async getRevenueByDoctor(startDate = null, endDate = null) {
        // 1. Get all payments joined with patients
        const payments = await this.getPaymentsWithDetails(startDate, endDate);

        // 2. Get all appointments to map Patient -> Doctor
        // We link patients to the doctor they see most often or last saw
        // REMOVED: .eq('status', 'completed') to ensure we catch all assigned doctors
        const { data: apts } = await supabase
            .from('appointments')
            .select('patient_id, doctor:doctors(name)')
            .not('doctor_id', 'is', null)
            .order('date', { ascending: true }); // Ensure we process chronologically

        // Map PatientID -> DoctorName
        const patientDoctorMap = {};
        if (apts) {
            apts.forEach(apt => {
                if (apt.doctor?.name && apt.patient_id) {
                    // Logic: Last write wins (most recent appointment)
                    patientDoctorMap[apt.patient_id] = apt.doctor.name;
                }
            });
        }

        // 3. Aggregate payments by Doctor
        const revenueByDoctor = {};

        // Calculate total to check if we have data
        let totalAssigned = 0;

        payments.forEach(payment => {
            // If we can't find a doctor via appointments, check if we can infer it differently? 
            // For now, default to 'Sin Asignar'
            const docName = patientDoctorMap[payment.patientId] || 'Sin Asignar';
            if (!revenueByDoctor[docName]) revenueByDoctor[docName] = 0;
            revenueByDoctor[docName] += payment.amount;
        });

        // 4. Transform to array
        return Object.entries(revenueByDoctor)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total);
    },

    /**
     * Get finance stats per patient (Total Paid and Total Budget)
     * Useful for identifying top spenders and patient value
     */
    async getPatientFinanceStats(limit = 10, startDate = null, endDate = null) {
        try {
            // 1. Get all budgets with items to calculate total commitment
            // Note: Commitment is usually all-time per patient, but we could link it to the period if needed.
            // For now, we fetch all to have context, but we will focus on payments in the period.
            const { data: budgets, error: bError } = await supabase
                .from('budgets')
                .select(`
                    id,
                    patient_id,
                    patient:patients(first_name, last_name, dni),
                    budget_items(unit_price, quantity, discount, discount_type)
                `);

            if (bError) throw bError;

            // 2. Get all payments to calculate actual revenue
            let pQuery = supabase
                .from('payments')
                .select('amount, created_at, budget_item:budget_items(budget_id)');

            if (startDate) pQuery = pQuery.gte('created_at', startDate);
            if (endDate) pQuery = pQuery.lte('created_at', endDate);

            const { data: payments, error: pError } = await pQuery;

            if (pError) throw pError;

            // Map to aggregate
            const statsMap = {};

            // Process budgets for commitment
            budgets.forEach(b => {
                if (!b.patient_id) return;
                const pid = b.patient_id;
                if (!statsMap[pid]) {
                    statsMap[pid] = {
                        id: pid,
                        name: `${b.patient?.first_name} ${b.patient?.last_name}`,
                        dni: b.patient?.dni,
                        totalBudget: 0,
                        totalPaid: 0
                    };
                }

                (b.budget_items || []).forEach(item => {
                    const raw = (parseFloat(item.unit_price) || 0) * (item.quantity || 1);
                    const disc = parseFloat(item.discount) || 0;
                    const amount = item.discount_type === 'percent' ? raw * (1 - disc / 100) : raw - disc;
                    statsMap[pid].totalBudget += Math.max(0, amount);
                });
            });

            // Process payments for actual revenue
            // (Alternative: we could use the paid_amount on budget_items if trusted)
            payments.forEach(p => {
                const budgetId = p.budget_item?.budget_id;
                const budget = budgets.find(b => b.id === budgetId);
                const pid = budget?.patient_id;
                if (pid && statsMap[pid]) {
                    statsMap[pid].totalPaid += parseFloat(p.amount) || 0;
                }
            });

            const result = Object.values(statsMap).sort((a, b) => b.totalPaid - a.totalPaid);
            return limit ? result.slice(0, limit) : result;

        } catch (error) {
            console.warn('Error fetching patient finance stats:', error);
            return [];
        }
    },

    /**
     * Get investment per patient (Legacy - kept for backward compatibility if used elsewhere)
     */
    async getInvestmentByPatient() {
        return this.getPatientFinanceStats(0);
    },

    /**
     * Get monthly revenue breakdown for a given year
     * Returns array of { month: 'Ene', revenue: 5200, lastYear: 4800 }
     */
    async getMonthlyRevenue(year = new Date().getFullYear()) {
        const startOfYear = new Date(year, 0, 1).toISOString();
        const endOfYear = new Date(year, 11, 31, 23, 59, 59).toISOString();

        const { data: payments, error } = await supabase
            .from('payments')
            .select('amount, created_at')
            .gte('created_at', startOfYear)
            .lte('created_at', endOfYear);

        if (error) {
            console.warn('Error fetching monthly revenue:', error);
            // Return empty revenue for all months instead of throwing
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return months.map(m => ({ name: m, revenue: 0 }));
        }

        // Initialize months
        const months = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        const monthlyData = months.map(m => ({ name: m, revenue: 0 }));

        payments.forEach(p => {
            const date = new Date(p.created_at);
            const monthIndex = date.getMonth();
            monthlyData[monthIndex].revenue += parseFloat(p.amount);
        });

        return monthlyData;
    },

    /**
     * Get payment method breakdown
     */
    async getPaymentMethodBreakdown() {
        const { data: payments, error } = await supabase
            .from('payments')
            .select('amount, method');

        if (error) {
            console.warn('Error fetching payment method breakdown:', error);
            return [];
        }

        const methodMap = {};

        payments.forEach(p => {
            const method = p.method || 'Otros';
            if (!methodMap[method]) methodMap[method] = 0;
            methodMap[method] += parseFloat(p.amount);
        });

        return Object.entries(methodMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }
};

// ============================================
// EXPENSES (Gastos Operativos y Compras)
// ============================================
export const expensesApi = {
    async getAll() {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });
        if (error) {
            console.warn('Error fetching expenses:', error);
            return [];
        }
        return data || [];
    },

    async getByPeriod(startDate, endDate) {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });
        if (error) {
            console.warn('Error fetching expenses by period:', error);
            return [];
        }
        return data || [];
    },

    async getCategories() {
        const { data, error } = await supabase
            .from('expense_categories')
            .select('*')
            .order('name');
        if (error) {
            console.warn('Error fetching expense_categories:', error);
            return [];
        }
        return data || [];
    },

    async create(expense) {
        const { data, error } = await supabase
            .from('expenses')
            .insert([expense])
            .select();
        if (error) throw error;
        return data[0];
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('expenses')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    },

    async delete(id) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

// ============================================
// INVENTORY (Productos y Stock)
// ============================================
export const inventoryApi = {
    async getProducts() {
        const { data, error } = await supabase
            .from('inventory_products')
            .select('*')
            .order('name');
        if (error) {
            console.warn('Error fetching inventory_products:', error);
            return [];
        }
        return data || [];
    },

    async createProduct(product) {
        const { data, error } = await supabase
            .from('inventory_products')
            .insert(product)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateProduct(id, updates) {
        const { data, error } = await supabase
            .from('inventory_products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateStock(id, newStock) {
        const { data, error } = await supabase
            .from('inventory_products')
            .update({ stock: newStock })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

// ============================================
// PURCHASES (Compras de Inventario)
// ============================================
export const purchasesApi = {
    async getAll() {
        const { data, error } = await supabase
            .from('purchases')
            .select(`
                *,
                purchase_items (
                    *,
                    product:inventory_products (name, unit)
                )
            `)
            .order('date', { ascending: false });
        if (error) throw error;
        return data;
    },

    async create(purchaseHeader, items) {
        // 1. Create Purchase Header
        const { data: purchase, error: pError } = await supabase
            .from('purchases')
            .insert(purchaseHeader)
            .select()
            .single();
        if (pError) throw pError;

        // 2. Create Items
        const itemsWithId = items.map(item => ({
            ...item,
            purchase_id: purchase.id
        }));

        const { error: iError } = await supabase
            .from('purchase_items')
            .insert(itemsWithId);
        if (iError) throw iError;

        // 3. If Status is 'pagada', update Stock and Create Expense
        if (purchase.status === 'pagada') {
            await this.processPaidPurchase(purchase.id, itemsWithId);
        }

        return purchase;
    },

    async processPaidPurchase(purchaseId, items) {
        // A. Update Stock
        for (const item of items) {
            // Fetch current stock
            const { data: prod } = await supabase
                .from('inventory_products')
                .select('stock')
                .eq('id', item.product_id)
                .single();

            if (prod) {
                const newStock = (prod.stock || 0) + parseInt(item.quantity);
                await supabase
                    .from('inventory_products')
                    .update({ stock: newStock })
                    .eq('id', item.product_id);
            }
        }

        // B. Create Expense Record
        // Re-fetch purchase to be safe
        const { data: purchase } = await supabase
            .from('purchases')
            .select('*')
            .eq('id', purchaseId)
            .single();

        if (purchase) {
            const expense = {
                date: purchase.date,
                amount: purchase.total,
                type: 'INVENTARIO',
                category: 'Materiales e Insumos',
                supplier: purchase.supplier,
                status: 'pagado',
                description: `Compra #INV-${purchase.id.slice(0, 6).toUpperCase()}`,
                purchase_id: purchase.id
            };
            await expensesApi.create(expense);
        }
    },

    async markAsPaid(id) {
        // 1. Update purchase status
        const { data: purchase, error } = await supabase
            .from('purchases')
            .update({ status: 'pagada', updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 2. Fetch items for this purchase
        const { data: items } = await supabase
            .from('purchase_items')
            .select('*')
            .eq('purchase_id', id);

        // 3. Process stock and expense
        if (items) {
            await this.processPaidPurchase(id, items);
        }
    },

    async delete(id) {
        // If deleting a paid purchase, strictly we should revert stock and expenses
        // For simplicity API, we just delete. Logic complex for full accounting.
        // Alert user in UI.

        // 1. Delete associated expense
        const { error: expenseError } = await supabase
            .from('expenses')
            .delete()
            .eq('purchase_id', id);

        // 2. Delete purchase (cascade deletes items)
        const { error } = await supabase
            .from('purchases')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};

// ============================================
// CASH FLOW (Resumen)
// ============================================
export const cashFlowApi = {
    async getSummary(startDate, endDate) {
        // 1. Income (Ingresos)
        const income = await financeApi.getIncomeByPeriod(startDate, endDate);

        // 2. Expenses (Egresos Pagados)
        const { data: expenses, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('status', 'pagado')
            .gte('date', startDate)
            .lte('date', endDate);

        let safeExpenses = expenses;
        if (error) {
            console.warn('Error fetching expenses for summary:', error);
            safeExpenses = [];
        } else if (!expenses) {
            safeExpenses = [];
        }

        const totalExpenses = safeExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

        // 3. Group Expenses by Category
        const expensesByCategory = safeExpenses.reduce((acc, curr) => {
            const cat = curr.category || 'Sin Categoría';
            if (!acc[cat]) acc[cat] = 0;
            acc[cat] += parseFloat(curr.amount);
            return acc;
        }, {});

        const expenseChartData = Object.entries(expensesByCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return {
            income,
            expenses: totalExpenses,
            balance: income - totalExpenses,
            expensesByCategory: expenseChartData,
            transactions: expenses // Return raw list for table if needed
        };
    },

    async getMonthlyTrend(year = new Date().getFullYear()) {
        const startOfYear = `${year}-01-01T00:00:00.000Z`;
        const endOfYear = `${year}-12-31T23:59:59.999Z`;

        // 1. Get Monthly Income
        const { data: payments, error: incomeError } = await supabase
            .from('payments')
            .select('amount, created_at')
            .gte('created_at', startOfYear)
            .lte('created_at', endOfYear);

        if (incomeError) throw incomeError;

        // 2. Get Monthly Expenses
        const { data: expenses, error: expenseError } = await supabase
            .from('expenses')
            .select('amount, date')
            .eq('status', 'pagado')
            .gte('date', startOfYear)
            .lte('date', endOfYear);

        if (expenseError) throw expenseError;

        // 3. Process Data
        const months = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        const trendData = months.map(m => ({ name: m, ingresos: 0, gastos: 0 }));

        payments.forEach(p => {
            const monthIndex = new Date(p.created_at).getMonth();
            trendData[monthIndex].ingresos += parseFloat(p.amount);
        });

        expenses.forEach(e => {
            // Note: date in expenses is YYYY-MM-DD (string) or Date object depending on how Supabase returns it.
            // Usually string '2025-01-20'. 
            // We use new Date(e.date + 'T00:00:00') to avoid timezone issues or just parse the string substring
            const monthIndex = new Date(e.date).getMonth();
            // Be careful with timezone, simple approach:
            // const parts = e.date.split('-'); const monthIndex = parseInt(parts[1]) - 1;
            // Let's use Date but ensure UTC handling if needed. Local date string usually parses to local time components.
            // Actually, best specific parsing:
            const d = new Date(e.date);
            // new Date('2025-01-01') is UTC. getMonth() returns month based on local time? No, it depends.
            // Safe parser:
            const monthIdx = parseInt(e.date.split('-')[1], 10) - 1;
            if (monthIdx >= 0 && monthIdx <= 11) {
                trendData[monthIdx].gastos += parseFloat(e.amount);
            }
        });

        return trendData;
    }
};

// ============================================
// ODONTOGRAM (Evolución y Snapshots)
// ============================================
export const odontogramApi = {
    /**
     * Get all snapshots for a patient (Initial vs Evolutive)
     */
    async getSnapshots(patientId) {
        const { data, error } = await supabase
            .from('odontogram_snapshots')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('Error fetching odontogram snapshots:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Get the latest snapshot of a specific type (e.g. current EVOLUTIVO)
     */
    async getLatest(patientId, type = 'EVOLUTIVO') {
        const { data, error } = await supabase
            .from('odontogram_snapshots')
            .select('*')
            .eq('patient_id', patientId)
            .eq('type', type)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
            console.warn(`Error fetching latest ${type} odontogram:`, error);
        }
        return data;
    },

    /**
     * Save a new snapshot state
     */
    async saveSnapshot(patientId, data, type = 'EVOLUTIVO', notes = '') {
        const { data: result, error } = await supabase
            .from('odontogram_snapshots')
            .insert({
                patient_id: patientId,
                type,
                data,
                notes,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    }
};

// ============================================
// FILES & IMAGING (Radiografías, 3D)
// ============================================
export const filesApi = {
    /**
     * Upload a file to Storage and create DB record
     * @param {string} patientId
     * @param {File} file
     * @param {string} category - 'RADIOGRAFIA' | 'SCAN_3D' | 'FRONTAL' | 'LATERAL' | 'INTERIOR'
     * @param {string|null} treatmentPlanId - optional, links image to a specific plan
     * @param {string|null} displayName - optional, user-provided custom name
     */
    async uploadFile(patientId, file, category = 'OTROS', treatmentPlanId = null, displayName = null) {
        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${patientId}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('clinical-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('clinical-files')
                .getPublicUrl(filePath);

            // 3. Create Record in DB
            const record = {
                patient_id: patientId,
                name: file.name,
                display_name: displayName || file.name,
                category,
                url: publicUrl,
                size_bytes: file.size,
                content_type: file.type,
                uploaded_at: new Date().toISOString()
            };

            if (treatmentPlanId) {
                record.treatment_plan_id = treatmentPlanId;
            }

            const { data, error: dbError } = await supabase
                .from('patient_files')
                .insert(record)
                .select()
                .single();

            if (dbError) throw dbError;

            return data;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    },

    /**
     * Get all files for a patient, optionally filtered by category and/or treatment plan
     */
    async getFiles(patientId, category = null, treatmentPlanId = null) {
        let query = supabase
            .from('patient_files')
            .select('*')
            .eq('patient_id', patientId)
            .order('uploaded_at', { ascending: false });

        if (category) {
            query = query.eq('category', category);
        }

        if (treatmentPlanId) {
            query = query.eq('treatment_plan_id', treatmentPlanId);
        } else if (treatmentPlanId === null && !category) {
            // Default: only files not linked to a plan
        }

        const { data, error } = await query;
        if (error) {
            console.warn('Error fetching patient files:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Rename a file's display name
     */
    async renameFile(id, newDisplayName) {
        const { error } = await supabase
            .from('patient_files')
            .update({ display_name: newDisplayName })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    /**
     * Delete a file from DB and Storage
     */
    async deleteFile(id, url) {
        // 1. Delete from DB
        const { error: dbError } = await supabase
            .from('patient_files')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;

        // 2. Delete from Storage (Optional but recommended)
        // Extract path from URL roughly (simplified)
        try {
            const path = url.split('/clinical-files/')[1];
            if (path) {
                await supabase.storage
                    .from('clinical-files')
                    .remove([path]);
            }
        } catch (err) {
            console.warn('Could not delete file from storage bucket:', err);
        }

        return true;
    }
};

// ============================================
// BITÁCORA / NOTAS EVOLUTIVAS
// ============================================
export const notesApi = {
    async getByPatient(patientId) {
        const { data, error } = await supabase
            .from('clinical_notes')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });
        if (error) {
            console.warn(`Error fetching notes for patient ${patientId}:`, error);
            return [];
        }
        return data || [];
    },

    async create(note) {
        const { data, error } = await supabase
            .from('clinical_notes')
            .insert(note)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('clinical_notes')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Evolution Notes
    async createEvolutionNote(note) {
        const { data, error } = await supabase
            .from('treatment_evolution_notes')
            .insert(note)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getEvolutionNotes(planId) {
        const { data, error } = await supabase
            .from('treatment_evolution_notes')
            .select('*')
            .eq('treatment_plan_id', planId)
            .order('created_at', { ascending: false });

        if (error) {
            console.warn(`Error fetching notes for plan ${planId}:`, error);
            return [];
        }
        return data || [];
    },

    async deleteEvolutionNote(id) {
        const { error } = await supabase
            .from('treatment_evolution_notes')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};

// ============================================
// TREATMENT PLAN (Hallazgos → Servicios → Presupuesto)
// ============================================

/**
 * Extract structured findings from odontogram JSONB data.
 * Groups surfaces by finding type per tooth.
 */
export function extractFindings(odontogramData) {
    const findings = [];
    const dientes = odontogramData?.dientes || {};

    for (const [toothNum, toothData] of Object.entries(dientes)) {
        // -- Surfaces (caries, restorations, etc.) --
        const surfaces = toothData.superficies || {};
        const groupedByFinding = {};

        for (const [surfName, surfData] of Object.entries(surfaces)) {
            if (!surfData?.hallazgo) continue;
            const key = surfData.hallazgo;
            if (!groupedByFinding[key]) {
                groupedByFinding[key] = {
                    surfaces: [],
                    color: surfData.color,
                    relleno: surfData.relleno,
                };
            }
            groupedByFinding[key].surfaces.push(surfName);
        }

        for (const [findingId, info] of Object.entries(groupedByFinding)) {
            findings.push({
                tooth_number: toothNum,
                surface: info.surfaces.join(', '),
                finding_type: findingId,
                finding_name: `${findingId} ${info.surfaces.join(', ')}`,
                color: info.color,
            });
        }

        // -- Corona --
        if (toothData.corona) {
            findings.push({
                tooth_number: toothNum,
                surface: null,
                finding_type: toothData.corona.tipo || 'corona',
                finding_name: `Corona ${toothData.corona.sigla || ''}`.trim(),
                color: toothData.corona.color || '#0000FF',
            });
        }

        // -- Raíz --
        if (toothData.raiz?.tratamiento || toothData.raiz?.sigla) {
            findings.push({
                tooth_number: toothNum,
                surface: null,
                finding_type: toothData.raiz.tratamiento || 'tratamiento_pulpar',
                finding_name: `Tto. Pulpar ${toothData.raiz.sigla || ''}`.trim(),
                color: '#0000FF',
            });
        }

        // -- Anotación (anomalías, implantes, etc.) --
        if (toothData.anotacion) {
            findings.push({
                tooth_number: toothNum,
                surface: null,
                finding_type: toothData.anotacion.toLowerCase(),
                finding_name: toothData.anotacion,
                color: '#0000FF',
            });
        }

        // -- Whole-tooth markers (ausente, fractura, etc.) --
        if (toothData.marker) {
            findings.push({
                tooth_number: toothNum,
                surface: null,
                finding_type: toothData.marker.tipo || toothData.marker.id || 'marker',
                finding_name: toothData.marker.nombre || toothData.marker.tipo || 'Hallazgo',
                color: toothData.marker.color || '#FF0000',
            });
        }

        // -- NEW: hallazgos array (COP standard) --
        const hallazgos = toothData.hallazgos || [];
        for (const h of hallazgos) {
            findings.push({
                tooth_number: toothNum,
                surface: null,
                finding_type: h.id,
                finding_name: h.id.replace(/_/g, ' '),
                color: h.color || '#0000FF',
            });
        }
    }

    // -- Rangos (prótesis, ortodoncia) --
    const rangos = odontogramData?.rangos || [];
    rangos.forEach(rango => {
        findings.push({
            tooth_number: `${rango.desde}-${rango.hasta}`,
            surface: null,
            finding_type: rango.tipo || 'rango',
            finding_name: rango.nombre || rango.tipo || 'Prótesis/Ortodoncia',
            color: rango.color || '#0000FF',
        });
    });

    return findings;
}

export const treatmentPlanApi = {
    // Plan Management
    async getAll() {
        const { data, error } = await supabase
            .from('treatment_plans')
            .select(`
                    *,
                    budget:budgets(*)
                `)
            .order('created_at', { ascending: false });
        if (error) {
            console.warn('Error fetching treatment plans:', error);
            return [];
        }
        return data || [];
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('treatment_plans')
            .select(`
                    *,
                    budget:budgets(*)
                `)
            .eq('id', id)
            .single();
        if (error) {
            console.warn(`Error fetching treatment plan ${id}:`, error);
            return null;
        }
        return data;
    },

    async create(plan) {
        const { data, error } = await supabase
            .from('treatment_plans')
            .insert(plan)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Evolution Specific Methods
    async updateEvolution(id, evolutionData) {
        const { data, error } = await supabase
            .from('treatment_plans')
            .update({
                evolution_odontogram_data: evolutionData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /**
     * Get all treatment plan items for a patient
     */
    async getByPatient(patientId) {
        const { data, error } = await supabase
            .from('treatment_plan_items')
            .select(`
                *,
                budget_items (
                    id,
                    service_name,
                    unit_price,
                    quantity,
                    paid_amount,
                    discount,
                    discount_type,
                    budget_id,
                    service_id,
                    budget:budgets (
                        id,
                        status,
                        is_treatment_plan
                    )
                )
            `)
            .eq('patient_id', patientId)
            .order('tooth_number', { ascending: true });

        if (error) {
            console.warn('Error fetching treatment plan items:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Sync treatment plan findings from odontogram data.
     * - Adds new findings that don't exist yet
     * - Marks removed findings' budget items as "revisar"
     * - Returns updated list
     */
    async syncFromOdontogram(patientId, snapshotId, odontogramData) {
        const currentFindings = extractFindings(odontogramData);
        const existingItems = await this.getByPatient(patientId);

        // Build lookup of existing items by tooth+finding_type key
        const existingKeys = new Set(
            existingItems.map(i => `${i.tooth_number}|${i.finding_type}|${i.surface || ''}`)
        );
        const newKeys = new Set(
            currentFindings.map(f => `${f.tooth_number}|${f.finding_type}|${f.surface || ''}`)
        );

        // 1. Insert new findings
        const toInsert = currentFindings.filter(
            f => !existingKeys.has(`${f.tooth_number}|${f.finding_type}|${f.surface || ''}`)
        );

        if (toInsert.length > 0) {
            const rows = toInsert.map(f => ({
                patient_id: patientId,
                odontogram_snapshot_id: snapshotId || null,
                tooth_number: f.tooth_number,
                surface: f.surface || null,
                finding_type: f.finding_type,
                finding_name: f.finding_name,
                status: 'pendiente',
            }));

            const { error } = await supabase
                .from('treatment_plan_items')
                .insert(rows);
            if (error) console.warn('Error inserting treatment plan items:', error);
        }

        // 2. Delete removed findings (clean removal)
        const removedItems = existingItems.filter(
            i => !newKeys.has(`${i.tooth_number}|${i.finding_type}|${i.surface || ''}`)
                && i.status !== 'completado'
        );

        for (const item of removedItems) {
            // Delete linked budget items first
            if (item.budget_items?.length > 0) {
                for (const bi of item.budget_items) {
                    await supabase.from('budget_items').delete().eq('id', bi.id);
                }
            }
            // Delete the treatment plan item
            await supabase.from('treatment_plan_items').delete().eq('id', item.id);
        }

        return await this.getByPatient(patientId);
    },

    /**
     * Add a service to a finding (creates budget item linked to finding)
     */
    async addServiceToFinding(findingId, patientId, serviceData) {
        // 1. Ensure draft budget exists for this patient
        let { data: draftBudgets } = await supabase
            .from('budgets')
            .select('*')
            .eq('patient_id', patientId)
            .eq('is_treatment_plan', true)
            .eq('status', 'created')
            .limit(1);

        let budget = draftBudgets?.[0];

        if (!budget) {
            const { data: newBudget, error } = await supabase
                .from('budgets')
                .insert({
                    patient_id: patientId,
                    title: 'Plan de Tratamiento',
                    status: 'created',
                    is_treatment_plan: true,
                })
                .select()
                .single();
            if (error) throw error;
            budget = newBudget;
        }

        // 2. Create budget item linked to finding
        const { data: item, error } = await supabase
            .from('budget_items')
            .insert({
                budget_id: budget.id,
                finding_id: findingId,
                service_id: serviceData.service_id,
                service_name: serviceData.service_name,
                tooth_number: serviceData.tooth_number || null,
                quantity: serviceData.quantity || 1,
                unit_price: serviceData.unit_price,
                discount: serviceData.discount || 0,
                discount_type: serviceData.discount_type || 'fixed',
                notes: serviceData.notes || null,
            })
            .select()
            .single();

        if (error) throw error;
        return item;
    },

    /**
     * Update a treatment plan item
     */
    async update(id, updates) {
        const { data, error } = await supabase
            .from('treatment_plan_items')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /**
     * Delete a treatment plan item and handle its budget items
     */
    async delete(id) {
        // Mark associated budget items for review
        await supabase
            .from('budget_items')
            .update({ notes: '[⚠ Hallazgo eliminado]' })
            .eq('finding_id', id);

        // Set finding_id to null so FK doesn't block delete
        await supabase
            .from('budget_items')
            .update({ finding_id: null })
            .eq('finding_id', id);

        const { error } = await supabase
            .from('treatment_plan_items')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /**
     * Remove a service (budget item) from a finding
     */
    async removeServiceFromFinding(budgetItemId) {
        const { error } = await supabase
            .from('budget_items')
            .delete()
            .eq('id', budgetItemId);
        if (error) throw error;
    },

    // Evolution Specific Methods

};

export default supabase;
