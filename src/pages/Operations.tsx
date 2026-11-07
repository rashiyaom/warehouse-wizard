import { useState } from "react";
import { 
  Search, 
  Plus, 
  CheckSquare, 
  AlertTriangle, 
  Truck, 
  RotateCcw, 
  FileText, 
  Calendar,
  User,
  Package,
  Warehouse,
  ClipboardCheck,
  Save,
  X,
  Edit3,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useInventory, useWarehouses, useProducts } from "@/hooks/useInventoryData";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Mock data for bulk operations
interface BulkOperation {
  id: string;
  operation_type: 'mass_transfer' | 'bulk_update' | 'batch_adjustment' | 'bulk_reorder';
  name: string;
  description: string;
  status: 'draft' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  total_items: number;
  processed_items: number;
  failed_items: number;
  created_by: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  source_warehouse_id?: string;
  source_warehouse_name?: string;
  target_warehouse_id?: string;
  target_warehouse_name?: string;
  error_message?: string;
}

interface BulkOperationItem {
  id: string;
  operation_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  from_warehouse?: string;
  to_warehouse?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
}

const mockBulkOperations: BulkOperation[] = [
  {
    id: "bulk1",
    operation_type: 'mass_transfer',
    name: "Q1 Inventory Rebalancing",
    description: "Transfer excess inventory from Central to regional warehouses",
    status: 'completed',
    total_items: 150,
    processed_items: 147,
    failed_items: 3,
    created_by: "Operations Manager",
    created_at: "2026-03-20T08:00:00Z",
    started_at: "2026-03-20T09:00:00Z",
    completed_at: "2026-03-20T14:30:00Z",
    source_warehouse_id: "w1",
    source_warehouse_name: "Central Warehouse",
    target_warehouse_id: "w2",
    target_warehouse_name: "North Distribution"
  },
  {
    id: "bulk2",
    operation_type: 'bulk_update',
    name: "Price Update - Electronics",
    description: "Update pricing for all electronics products",
    status: 'in_progress',
    total_items: 85,
    processed_items: 42,
    failed_items: 0,
    created_by: "Sarah Johnson",
    created_at: "2026-03-24T10:00:00Z",
    started_at: "2026-03-24T10:15:00Z"
  }
];

const mockBulkOperationItems: BulkOperationItem[] = [
  {
    id: "bi1",
    operation_id: "bulk1",
    product_id: "p1",
    product_name: "iPhone 15 Pro",
    sku: "IPH15P128",
    quantity: 25,
    from_warehouse: "Central Warehouse",
    to_warehouse: "North Distribution",
    status: 'completed'
  },
  {
    id: "bi2",
    operation_id: "bulk1",
    product_id: "p2",
    product_name: "MacBook Air M3",
    sku: "MBA13M3",
    quantity: 15,
    from_warehouse: "Central Warehouse",
    to_warehouse: "North Distribution",
    status: 'failed',
    error_message: "Insufficient quantity in source warehouse"
  }
];

// Mock data for returns management
interface ReturnRequest {
  id: string;
  rma_number: string;
  customer_name: string;
  customer_email: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity_returned: number;
  reason: 'defective' | 'wrong_item' | 'customer_request' | 'damaged_shipping' | 'other';
  condition: 'new' | 'damaged' | 'used' | 'defective';
  warehouse_id: string;
  warehouse_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'refunded';
  return_date: string;
  processed_date?: string;
  refund_amount: number;
  notes: string;
  created_by: string;
}

const mockReturns: ReturnRequest[] = [
  {
    id: "ret1",
    rma_number: "RMA-2026-001",
    customer_name: "John Smith",
    customer_email: "john.smith@email.com",
    product_id: "p1",
    product_name: "iPhone 15 Pro",
    sku: "IPH15P128",
    quantity_returned: 1,
    reason: 'defective',
    condition: 'defective',
    warehouse_id: "w1",
    warehouse_name: "Central Warehouse",
    status: 'pending',
    return_date: "2026-03-22T10:30:00Z",
    refund_amount: 999.99,
    notes: "Screen flickering issue reported by customer",
    created_by: "Sarah Johnson"
  },
  {
    id: "ret2",
    rma_number: "RMA-2026-002",
    customer_name: "Emma Davis",
    customer_email: "emma.davis@email.com",
    product_id: "p2",
    product_name: "MacBook Air M3",
    sku: "MBA13M3",
    quantity_returned: 1,
    reason: 'wrong_item',
    condition: 'new',
    warehouse_id: "w1",
    warehouse_name: "Central Warehouse",
    status: 'approved',
    return_date: "2026-03-20T14:15:00Z",
    processed_date: "2026-03-21T09:00:00Z",
    refund_amount: 1299.99,
    notes: "Customer ordered 16GB model but received 8GB",
    created_by: "Mike Chen"
  }
];

// Mock data for stock take sessions
interface StockTakeSession {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  session_name: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  completed_at?: string;
  items_scanned: number;
  total_items: number;
  accuracy_percentage: number;
}

interface StockTakeItem {
  id: string;
  session_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  expected_quantity: number;
  counted_quantity: number;
  variance: number;
  notes: string;
  scanned_at: string;
  scanned_by: string;
}

const mockStockTakeSessions: StockTakeSession[] = [
  {
    id: "st1",
    warehouse_id: "w1",
    warehouse_name: "Central Warehouse",
    session_name: "Q1 2026 Full Count",
    status: 'completed',
    created_by: "John Smith",
    created_at: "2026-03-20T09:00:00Z",
    completed_at: "2026-03-20T17:30:00Z",
    items_scanned: 245,
    total_items: 250,
    accuracy_percentage: 96.8
  },
  {
    id: "st2",
    warehouse_id: "w2", 
    warehouse_name: "North Distribution",
    session_name: "Electronics Section Count",
    status: 'in_progress',
    created_by: "Sarah Johnson",
    created_at: "2026-03-24T08:00:00Z",
    items_scanned: 87,
    total_items: 120,
    accuracy_percentage: 94.2
  }
];

const mockStockTakeItems: StockTakeItem[] = [
  {
    id: "sti1",
    session_id: "st1",
    product_id: "p1",
    product_name: "iPhone 15 Pro",
    sku: "IPH15P128",
    expected_quantity: 25,
    counted_quantity: 23,
    variance: -2,
    notes: "2 units missing - possible theft",
    scanned_at: "2026-03-20T10:15:00Z",
    scanned_by: "John Smith"
  },
  {
    id: "sti2", 
    session_id: "st1",
    product_id: "p2",
    product_name: "MacBook Air M3",
    sku: "MBA13M3",
    expected_quantity: 15,
    counted_quantity: 17,
    variance: 2,
    notes: "2 extra units found in overflow area",
    scanned_at: "2026-03-20T11:30:00Z",
    scanned_by: "John Smith"
  }
];

// Mock data for audit records - in real app this would come from database
interface AuditRecord {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  product_id: string;
  product_name: string;
  expected_quantity: number;
  actual_quantity: number;
  variance: number;
  notes: string;
  auditor: string;
  status: 'pending' | 'completed' | 'needs_review';
  created_at: string;
}

const mockAudits: AuditRecord[] = [
  {
    id: "1",
    warehouse_id: "w1",
    warehouse_name: "Central Warehouse",
    product_id: "p1",
    product_name: "iPhone 15 Pro",
    expected_quantity: 50,
    actual_quantity: 48,
    variance: -2,
    notes: "2 units missing, investigating potential theft",
    auditor: "John Smith",
    status: 'needs_review',
    created_at: "2026-03-24T10:30:00Z"
  },
  {
    id: "2",
    warehouse_id: "w1",
    warehouse_name: "Central Warehouse",
    product_id: "p2",
    product_name: "MacBook Air M3",
    expected_quantity: 25,
    actual_quantity: 27,
    variance: 2,
    notes: "2 extra units found in receiving area",
    auditor: "Sarah Johnson",
    status: 'completed',
    created_at: "2026-03-24T09:15:00Z"
  }
];

export default function Operations() {
  const { data: inventory } = useInventory();
  const { data: warehouses } = useWarehouses();
  const { data: products } = useProducts();  const [activeOperation, setActiveOperation] = useState<'audit' | 'stocktake' | 'returns' | 'bulk' | null>(null);
  const [audits, setAudits] = useState<AuditRecord[]>(mockAudits);
  const [stockTakeSessions, setStockTakeSessions] = useState<StockTakeSession[]>(mockStockTakeSessions);
  const [stockTakeItems, setStockTakeItems] = useState<StockTakeItem[]>(mockStockTakeItems);
  const [returns, setReturns] = useState<ReturnRequest[]>(mockReturns);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>(mockBulkOperations);
  const [bulkOperationItems, setBulkOperationItems] = useState<BulkOperationItem[]>(mockBulkOperationItems);
  
  const [auditForm, setAuditForm] = useState({
    warehouse_id: '',
    product_id: '',
    expected_quantity: 0,
    actual_quantity: 0,
    notes: '',
    auditor: ''
  });

  // Stock Take form state
  const [stockTakeForm, setStockTakeForm] = useState({
    warehouse_id: '',
    session_name: '',
    created_by: ''
  });

  // Stock Take Item form state
  const [stockTakeItemForm, setStockTakeItemForm] = useState({
    session_id: '',
    product_id: '',
    expected_quantity: 0,
    counted_quantity: 0,
    notes: '',
    scanned_by: ''
  });  // Returns form state
  const [returnsForm, setReturnsForm] = useState({
    customer_name: '',
    customer_email: '',
    product_id: '',
    quantity_returned: 1,
    reason: 'defective' as ReturnRequest['reason'],
    condition: 'used' as ReturnRequest['condition'],
    warehouse_id: '',
    refund_amount: 0,
    notes: '',
    created_by: ''
  });

  // Bulk Operations form state
  const [bulkOperationsForm, setBulkOperationsForm] = useState({
    operation_type: 'mass_transfer' as BulkOperation['operation_type'],
    name: '',
    description: '',
    source_warehouse_id: '',
    target_warehouse_id: '',
    created_by: ''
  });
  
  // Inventory Audit Functions
  const handleCreateAudit = () => {
    if (!auditForm.warehouse_id || !auditForm.product_id || !auditForm.auditor) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const selectedWarehouse = warehouses?.find(w => w.id === auditForm.warehouse_id);
    const selectedProduct = products?.find(p => p.id === auditForm.product_id);
    const variance = auditForm.actual_quantity - auditForm.expected_quantity;
    
    const newAudit: AuditRecord = {
      id: `audit_${Date.now()}`,
      warehouse_id: auditForm.warehouse_id,
      warehouse_name: selectedWarehouse?.name || '',
      product_id: auditForm.product_id,
      product_name: selectedProduct?.name || '',
      expected_quantity: auditForm.expected_quantity,
      actual_quantity: auditForm.actual_quantity,
      variance,
      notes: auditForm.notes,
      auditor: auditForm.auditor,
      status: variance === 0 ? 'completed' : 'needs_review',
      created_at: new Date().toISOString()
    };
    
    setAudits(prev => [newAudit, ...prev]);
    setAuditForm({
      warehouse_id: '',
      product_id: '',
      expected_quantity: 0,
      actual_quantity: 0,
      notes: '',
      auditor: ''
    });
    setActiveOperation(null);    toast.success("Audit record created successfully");
  };

  // Stock Take Functions
  const handleCreateStockTakeSession = () => {
    if (!stockTakeForm.warehouse_id || !stockTakeForm.session_name || !stockTakeForm.created_by) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const selectedWarehouse = warehouses?.find(w => w.id === stockTakeForm.warehouse_id);
    const totalItems = inventory?.filter(i => i.warehouse_id === stockTakeForm.warehouse_id).length || 0;
    
    const newSession: StockTakeSession = {
      id: `st_${Date.now()}`,
      warehouse_id: stockTakeForm.warehouse_id,
      warehouse_name: selectedWarehouse?.name || '',
      session_name: stockTakeForm.session_name,
      status: 'draft',
      created_by: stockTakeForm.created_by,
      created_at: new Date().toISOString(),
      items_scanned: 0,
      total_items: totalItems,
      accuracy_percentage: 0
    };
    
    setStockTakeSessions(prev => [newSession, ...prev]);
    setStockTakeForm({
      warehouse_id: '',
      session_name: '',
      created_by: ''
    });
    toast.success("Stock take session created successfully");
  };

  const handleStartStockTake = (sessionId: string) => {
    setStockTakeSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, status: 'in_progress' }
        : session
    ));
    toast.success("Stock take session started");
  };

  const handleCompleteStockTake = (sessionId: string) => {
    const sessionItems = stockTakeItems.filter(item => item.session_id === sessionId);
    const accurateCount = sessionItems.filter(item => item.variance === 0).length;
    const accuracy = sessionItems.length > 0 ? (accurateCount / sessionItems.length) * 100 : 0;
    
    setStockTakeSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { 
            ...session, 
            status: 'completed',
            completed_at: new Date().toISOString(),
            accuracy_percentage: accuracy
          }
        : session
    ));
    toast.success("Stock take session completed");
  };
  const getSessionStatusColor = (status: StockTakeSession['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Returns Management Functions
  const handleCreateReturn = () => {
    if (!returnsForm.customer_name || !returnsForm.product_id || !returnsForm.warehouse_id || !returnsForm.created_by) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const selectedWarehouse = warehouses?.find(w => w.id === returnsForm.warehouse_id);
    const selectedProduct = products?.find(p => p.id === returnsForm.product_id);
    const rmaNumber = `RMA-${new Date().getFullYear()}-${String(returns.length + 1).padStart(3, '0')}`;
    
    const newReturn: ReturnRequest = {
      id: `ret_${Date.now()}`,
      rma_number: rmaNumber,
      customer_name: returnsForm.customer_name,
      customer_email: returnsForm.customer_email,
      product_id: returnsForm.product_id,
      product_name: selectedProduct?.name || '',
      sku: selectedProduct?.sku || '',
      quantity_returned: returnsForm.quantity_returned,
      reason: returnsForm.reason,
      condition: returnsForm.condition,
      warehouse_id: returnsForm.warehouse_id,
      warehouse_name: selectedWarehouse?.name || '',
      status: 'pending',
      return_date: new Date().toISOString(),
      refund_amount: returnsForm.refund_amount,
      notes: returnsForm.notes,
      created_by: returnsForm.created_by
    };
    
    setReturns(prev => [newReturn, ...prev]);
    setReturnsForm({
      customer_name: '',
      customer_email: '',
      product_id: '',
      quantity_returned: 1,
      reason: 'defective',
      condition: 'used',
      warehouse_id: '',
      refund_amount: 0,
      notes: '',
      created_by: ''
    });
    toast.success(`Return request created: ${rmaNumber}`);
  };

  const handleUpdateReturnStatus = (returnId: string, status: ReturnRequest['status']) => {
    setReturns(prev => prev.map(ret => 
      ret.id === returnId 
        ? { 
            ...ret, 
            status,
            processed_date: status === 'processed' || status === 'refunded' ? new Date().toISOString() : ret.processed_date
          }
        : ret
    ));    toast.success(`Return status updated to ${status}`);
  };

  // Bulk Operations Functions
  const handleCreateBulkOperation = () => {
    if (!bulkOperationsForm.name || !bulkOperationsForm.created_by) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (bulkOperationsForm.operation_type === 'mass_transfer' && 
        (!bulkOperationsForm.source_warehouse_id || !bulkOperationsForm.target_warehouse_id)) {
      toast.error("Please select both source and target warehouses for mass transfer");
      return;
    }
    
    const sourceWarehouse = warehouses?.find(w => w.id === bulkOperationsForm.source_warehouse_id);
    const targetWarehouse = warehouses?.find(w => w.id === bulkOperationsForm.target_warehouse_id);
    
    const newOperation: BulkOperation = {
      id: `bulk_${Date.now()}`,
      operation_type: bulkOperationsForm.operation_type,
      name: bulkOperationsForm.name,
      description: bulkOperationsForm.description,
      status: 'draft',
      total_items: 0, // Will be updated when items are added
      processed_items: 0,
      failed_items: 0,
      created_by: bulkOperationsForm.created_by,
      created_at: new Date().toISOString(),
      source_warehouse_id: bulkOperationsForm.source_warehouse_id || undefined,
      source_warehouse_name: sourceWarehouse?.name || undefined,
      target_warehouse_id: bulkOperationsForm.target_warehouse_id || undefined,
      target_warehouse_name: targetWarehouse?.name || undefined
    };
    
    setBulkOperations(prev => [newOperation, ...prev]);
    setBulkOperationsForm({
      operation_type: 'mass_transfer',
      name: '',
      description: '',
      source_warehouse_id: '',
      target_warehouse_id: '',
      created_by: ''
    });
    toast.success("Bulk operation created successfully");
  };

  const handleStartBulkOperation = (operationId: string) => {
    setBulkOperations(prev => prev.map(op => 
      op.id === operationId 
        ? { 
            ...op, 
            status: 'in_progress',
            started_at: new Date().toISOString()
          }
        : op
    ));
    toast.success("Bulk operation started");
  };

  const handleCancelBulkOperation = (operationId: string) => {
    setBulkOperations(prev => prev.map(op => 
      op.id === operationId 
        ? { ...op, status: 'cancelled' }
        : op
    ));
    toast.success("Bulk operation cancelled");
  };

  const getBulkOperationStatusColor = (status: BulkOperation['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getBulkOperationTypeColor = (type: BulkOperation['operation_type']) => {
    switch (type) {
      case 'mass_transfer': return 'text-blue-600';
      case 'bulk_update': return 'text-purple-600';
      case 'batch_adjustment': return 'text-orange-600';
      case 'bulk_reorder': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getReturnStatusColor = (status: ReturnRequest['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getReasonColor = (reason: ReturnRequest['reason']) => {
    switch (reason) {
      case 'defective': return 'text-red-600';
      case 'damaged_shipping': return 'text-orange-600';
      case 'wrong_item': return 'text-blue-600';
      case 'customer_request': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'needs_review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance === 0) return 'text-green-600';
    if (variance > 0) return 'text-blue-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Warehouse Operations
        </h1>
        <p className="text-muted-foreground text-lg mt-2 font-medium">
          Manage audits, stock takes, returns, and transfers
        </p>
      </div>

      {/* Operation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-lg transition-all duration-300"
          onClick={() => setActiveOperation('audit')}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-500">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Inventory Audit</h3>
              <p className="text-sm text-blue-700">Physical count verification</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-600">Pending Audits</span>
              <span className="font-semibold text-blue-800">
                {audits.filter(a => a.status === 'needs_review').length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-600">Completed Today</span>
              <span className="font-semibold text-blue-800">
                {audits.filter(a => a.status === 'completed' && 
                  new Date(a.created_at).toDateString() === new Date().toDateString()).length}
              </span>
            </div>
          </div>
        </motion.div>        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-lg transition-all duration-300"
          onClick={() => setActiveOperation('stocktake')}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-green-500">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Stock Take</h3>
              <p className="text-sm text-green-700">Complete inventory count</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Active Sessions</span>
              <span className="font-semibold text-green-800">
                {stockTakeSessions.filter(s => s.status === 'in_progress').length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Draft Sessions</span>
              <span className="font-semibold text-green-800">
                {stockTakeSessions.filter(s => s.status === 'draft').length}
              </span>
            </div>
          </div>
        </motion.div>        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer p-6 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 hover:shadow-lg transition-all duration-300"
          onClick={() => setActiveOperation('returns')}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-orange-500">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-900">Returns</h3>
              <p className="text-sm text-orange-700">Process returns & RMA</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-orange-600">Pending Returns</span>
              <span className="font-semibold text-orange-800">
                {returns.filter(r => r.status === 'pending').length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-orange-600">Total Refunds</span>
              <span className="font-semibold text-orange-800">
                ${returns.filter(r => r.status === 'refunded')
                  .reduce((sum, r) => sum + r.refund_amount, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-lg transition-all duration-300"
          onClick={() => setActiveOperation('bulk')}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-purple-500">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900">Bulk Operations</h3>
              <p className="text-sm text-purple-700">Mass transfers & updates</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-purple-600">Active Operations</span>
              <span className="font-semibold text-purple-800">
                {bulkOperations.filter(op => op.status === 'in_progress').length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-600">Total Items Processed</span>
              <span className="font-semibold text-purple-800">
                {bulkOperations.reduce((sum, op) => sum + op.processed_items, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Inventory Audit Section */}
      {activeOperation === 'audit' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Inventory Audit</h2>
            <div className="flex gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Audit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Audit Record</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Warehouse *</Label>
                        <Select 
                          value={auditForm.warehouse_id} 
                          onValueChange={(v) => setAuditForm({...auditForm, warehouse_id: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses?.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id}>
                                {warehouse.name} - {warehouse.location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Product *</Label>
                        <Select 
                          value={auditForm.product_id} 
                          onValueChange={(v) => setAuditForm({...auditForm, product_id: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Expected Quantity</Label>
                        <Input
                          type="number"
                          value={auditForm.expected_quantity}
                          onChange={(e) => setAuditForm({...auditForm, expected_quantity: parseInt(e.target.value) || 0})}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Actual Quantity</Label>
                        <Input
                          type="number"
                          value={auditForm.actual_quantity}
                          onChange={(e) => setAuditForm({...auditForm, actual_quantity: parseInt(e.target.value) || 0})}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Variance</Label>
                        <Input
                          value={auditForm.actual_quantity - auditForm.expected_quantity}
                          disabled
                          className="font-mono"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Auditor *</Label>
                      <Input
                        value={auditForm.auditor}
                        onChange={(e) => setAuditForm({...auditForm, auditor: e.target.value})}
                        placeholder="Enter auditor name"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Notes</Label>
                      <Textarea
                        value={auditForm.notes}
                        onChange={(e) => setAuditForm({...auditForm, notes: e.target.value})}
                        placeholder="Add any observations or discrepancies..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" onClick={() => setActiveOperation(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAudit} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        Create Audit
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                onClick={() => setActiveOperation(null)}
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </div>

          {/* Audit Records Table */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Warehouse</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Product</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Expected</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Actual</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Variance</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Auditor</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((audit) => (
                    <tr key={audit.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-foreground">
                          {new Date(audit.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(audit.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Warehouse className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {audit.warehouse_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {audit.product_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-mono text-sm text-foreground">
                          {audit.expected_quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-mono text-sm text-foreground">
                          {audit.actual_quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`font-mono text-sm font-medium ${getVarianceColor(audit.variance)}`}>
                          {audit.variance > 0 ? '+' : ''}{audit.variance.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{audit.auditor}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge className={`text-xs ${getStatusColor(audit.status)}`}>
                          {audit.status.replace('_', ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {audits.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No audit records found</p>
                  <p className="text-sm">Create your first audit record to get started</p>
                </div>
              )}
            </div>
          </div>        </motion.div>
      )}

      {/* Stock Take Section */}
      {activeOperation === 'stocktake' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Stock Take Management</h2>
            <div className="flex gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Stock Take Session</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Warehouse *</Label>
                        <Select 
                          value={stockTakeForm.warehouse_id} 
                          onValueChange={(v) => setStockTakeForm({...stockTakeForm, warehouse_id: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses?.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id}>
                                {warehouse.name} - {warehouse.location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Session Name *</Label>
                        <Input
                          value={stockTakeForm.session_name}
                          onChange={(e) => setStockTakeForm({...stockTakeForm, session_name: e.target.value})}
                          placeholder="e.g., Q1 2026 Full Count"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Created By *</Label>
                      <Input
                        value={stockTakeForm.created_by}
                        onChange={(e) => setStockTakeForm({...stockTakeForm, created_by: e.target.value})}
                        placeholder="Enter your name"
                      />
                    </div>
                    
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" onClick={() => setActiveOperation(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateStockTakeSession} className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        Create Session
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                onClick={() => setActiveOperation(null)}
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </div>

          {/* Stock Take Sessions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {stockTakeSessions.map((session) => (
              <motion.div
                key={session.id}
                whileHover={{ scale: 1.02 }}
                className="bg-card rounded-xl border border-border/50 p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{session.session_name}</h3>
                    <p className="text-sm text-muted-foreground">{session.warehouse_name}</p>
                  </div>
                  <Badge className={`text-xs ${getSessionStatusColor(session.status)}`}>
                    {session.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">
                      {session.items_scanned}/{session.total_items}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${session.total_items > 0 ? (session.items_scanned / session.total_items) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  {session.status === 'completed' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Accuracy</span>
                      <span className="font-medium text-green-600">
                        {session.accuracy_percentage.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <span>Created by {session.created_by}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(session.created_at).toLocaleDateString()}</span>
                  </div>
                  {session.completed_at && (
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-3 h-3" />
                      <span>Completed {new Date(session.completed_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  {session.status === 'draft' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleStartStockTake(session.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Start Count
                    </Button>
                  )}
                  {session.status === 'in_progress' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleCompleteStockTake(session.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Complete
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-3 h-3 mr-1" />
                    View Details
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {stockTakeSessions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No stock take sessions found</p>
              <p className="text-sm">Create your first stock take session to get started</p>
            </div>          )}
        </motion.div>
      )}

      {/* Returns Management Section */}
      {activeOperation === 'returns' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Returns Management</h2>
            <div className="flex gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Return
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Create Return Request</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Customer Name *</Label>
                        <Input
                          value={returnsForm.customer_name}
                          onChange={(e) => setReturnsForm({...returnsForm, customer_name: e.target.value})}
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Customer Email</Label>
                        <Input
                          type="email"
                          value={returnsForm.customer_email}
                          onChange={(e) => setReturnsForm({...returnsForm, customer_email: e.target.value})}
                          placeholder="customer@email.com"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Product *</Label>
                        <Select 
                          value={returnsForm.product_id} 
                          onValueChange={(v) => setReturnsForm({...returnsForm, product_id: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Return Warehouse *</Label>
                        <Select 
                          value={returnsForm.warehouse_id} 
                          onValueChange={(v) => setReturnsForm({...returnsForm, warehouse_id: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses?.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id}>
                                {warehouse.name} - {warehouse.location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={returnsForm.quantity_returned}
                          onChange={(e) => setReturnsForm({...returnsForm, quantity_returned: parseInt(e.target.value) || 1})}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Return Reason</Label>
                        <Select 
                          value={returnsForm.reason} 
                          onValueChange={(v) => setReturnsForm({...returnsForm, reason: v as ReturnRequest['reason']})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="defective">Defective</SelectItem>
                            <SelectItem value="wrong_item">Wrong Item</SelectItem>
                            <SelectItem value="customer_request">Customer Request</SelectItem>
                            <SelectItem value="damaged_shipping">Damaged in Shipping</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Condition</Label>
                        <Select 
                          value={returnsForm.condition} 
                          onValueChange={(v) => setReturnsForm({...returnsForm, condition: v as ReturnRequest['condition']})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="used">Used</SelectItem>
                            <SelectItem value="damaged">Damaged</SelectItem>
                            <SelectItem value="defective">Defective</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Refund Amount ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={returnsForm.refund_amount}
                          onChange={(e) => setReturnsForm({...returnsForm, refund_amount: parseFloat(e.target.value) || 0})}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Processed By *</Label>
                        <Input
                          value={returnsForm.created_by}
                          onChange={(e) => setReturnsForm({...returnsForm, created_by: e.target.value})}
                          placeholder="Enter your name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Notes</Label>
                      <Textarea
                        value={returnsForm.notes}
                        onChange={(e) => setReturnsForm({...returnsForm, notes: e.target.value})}
                        placeholder="Additional notes about the return..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" onClick={() => setActiveOperation(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateReturn} className="bg-orange-600 hover:bg-orange-700">
                        <Save className="w-4 h-4 mr-2" />
                        Create Return
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                onClick={() => setActiveOperation(null)}
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </div>

          {/* Returns Table */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">RMA</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Product</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Qty</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Reason</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Condition</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Refund</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((returnItem) => (
                    <tr key={returnItem.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-4">
                        <div className="text-sm font-mono font-medium text-foreground">
                          {returnItem.rma_number}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(returnItem.return_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-foreground">
                          {returnItem.customer_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {returnItem.customer_email}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {returnItem.product_name}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {returnItem.sku}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-mono text-sm text-foreground">
                          {returnItem.quantity_returned}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-sm font-medium ${getReasonColor(returnItem.reason)}`}>
                          {returnItem.reason.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="text-xs">
                          {returnItem.condition}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-semibold text-sm text-foreground">
                          ${returnItem.refund_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge className={`text-xs ${getReturnStatusColor(returnItem.status)}`}>
                          {returnItem.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {returnItem.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateReturnStatus(returnItem.id, 'approved')}
                                className="h-7 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateReturnStatus(returnItem.id, 'rejected')}
                                className="h-7 px-2 text-xs bg-red-50 hover:bg-red-100 text-red-700"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {returnItem.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateReturnStatus(returnItem.id, 'processed')}
                              className="h-7 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700"
                            >
                              Process
                            </Button>
                          )}
                          {returnItem.status === 'processed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateReturnStatus(returnItem.id, 'refunded')}
                              className="h-7 px-2 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700"
                            >
                              Refund
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {returns.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No return requests found</p>
                  <p className="text-sm">Create your first return request to get started</p>
                </div>
              )}
            </div>
          </div>        </motion.div>
      )}

      {/* Bulk Operations Section */}
      {activeOperation === 'bulk' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Bulk Operations</h2>
            <div className="flex gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Bulk Operation
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Bulk Operation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="operationType">Operation Type</Label>
                      <Select
                        value={bulkOperationsForm.operation_type}
                        onValueChange={(value: BulkOperation['operation_type']) => 
                          setBulkOperationsForm(prev => ({ ...prev, operation_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select operation type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mass_transfer">Mass Transfer</SelectItem>
                          <SelectItem value="bulk_update">Bulk Update</SelectItem>
                          <SelectItem value="batch_adjustment">Batch Adjustment</SelectItem>
                          <SelectItem value="bulk_reorder">Bulk Reorder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="operationName">Operation Name</Label>
                      <Input
                        id="operationName"
                        value={bulkOperationsForm.name}
                        onChange={(e) => setBulkOperationsForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter operation name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="operationDescription">Description</Label>
                      <Textarea
                        id="operationDescription"
                        value={bulkOperationsForm.description}
                        onChange={(e) => setBulkOperationsForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter operation description"
                        rows={3}
                      />
                    </div>
                    {bulkOperationsForm.operation_type === 'mass_transfer' && (
                      <>
                        <div>
                          <Label htmlFor="sourceWarehouse">Source Warehouse</Label>
                          <Select
                            value={bulkOperationsForm.source_warehouse_id}
                            onValueChange={(value) => 
                              setBulkOperationsForm(prev => ({ ...prev, source_warehouse_id: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source warehouse" />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses?.map((warehouse) => (
                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                  {warehouse.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="targetWarehouse">Target Warehouse</Label>
                          <Select
                            value={bulkOperationsForm.target_warehouse_id}
                            onValueChange={(value) => 
                              setBulkOperationsForm(prev => ({ ...prev, target_warehouse_id: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select target warehouse" />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses?.map((warehouse) => (
                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                  {warehouse.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    <div>
                      <Label htmlFor="createdBy">Created By</Label>
                      <Input
                        id="createdBy"
                        value={bulkOperationsForm.created_by}
                        onChange={(e) => setBulkOperationsForm(prev => ({ ...prev, created_by: e.target.value }))}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setBulkOperationsForm({
                          operation_type: 'mass_transfer',
                          name: '',
                          description: '',
                          source_warehouse_id: '',
                          target_warehouse_id: '',
                          created_by: ''
                        })}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleCreateBulkOperation} className="bg-purple-600 hover:bg-purple-700">
                        <Save className="w-4 h-4 mr-2" />
                        Create Operation
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                onClick={() => setActiveOperation(null)}
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </div>

          {/* Bulk Operations Table */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Operation</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Progress</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Warehouses</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Created</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkOperations.map((operation) => (
                    <tr key={operation.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-foreground">
                          {operation.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {operation.description}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`text-sm font-medium capitalize ${getBulkOperationTypeColor(operation.operation_type)}`}>
                          {operation.operation_type.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{operation.total_items > 0 ? Math.round((operation.processed_items / operation.total_items) * 100) : 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${operation.total_items > 0 ? (operation.processed_items / operation.total_items) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {operation.processed_items}/{operation.total_items} items
                            {operation.failed_items > 0 && (
                              <span className="text-red-600 ml-2">
                                ({operation.failed_items} failed)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {operation.operation_type === 'mass_transfer' ? (
                          <div className="text-sm">
                            <div className="text-foreground font-medium">
                              {operation.source_warehouse_name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              → {operation.target_warehouse_name}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            All warehouses
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-foreground">
                          {operation.created_by}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(operation.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge className={getBulkOperationStatusColor(operation.status)}>
                          {operation.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.info(`Viewing details for ${operation.name}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {operation.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => handleStartBulkOperation(operation.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Start
                            </Button>
                          )}
                          {operation.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelBulkOperation(operation.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {bulkOperations.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No bulk operations found</p>
                  <p className="text-sm">Create your first bulk operation to get started</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
