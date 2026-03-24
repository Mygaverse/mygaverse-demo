'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronRight, ChevronDown, CreditCard2Front, Paypal, PlusCircle,
    FileEarmarkPdf, CheckCircleFill, ExclamationCircleFill,
    ClockFill, Search, CreditCard, X, Check, LockFill, ExclamationTriangleFill
} from 'react-bootstrap-icons';
import { Button } from '../ui/Button';
import { useBilling } from '../../../hooks/useBilling';

// --------------------------------------------------------------------------
// MOCK DATA
// --------------------------------------------------------------------------
const FREE_TRIAL_PLAN = {
    name: 'Advertising Pro',
    overage: '+2% of Ad Spend over $50,000',
    amount: 449.00,
    monthlyAdSpend: 50000,
    currentAdSpend: 51000,
    remainingAdSpend: 0,
    overageAmount: 1000,
    overageRate: 2,
    ovarageFee: 20.00,
    trialDaysTotal: 30,
    trialDaysUsed: 14,
    trialStatus: 'active',
};

const SUBSCRIBED_PLAN = {
    name: 'Advertising Growth',
    overage: '+2% of Ad Spend over $50,000',
    amount: 299.00,
    billingCycle: 'Monthly',
    nextPaymentDate: '09/01/2025',
    overageFee: 0.00,
};

const CANCELED_PLAN = {
    name: 'Advertising Pro',
    overage: '+2% of Ad Spend over $50,000',
    amount: 449.00,
    billingCycle: 'Annual',
    expirationDate: '09/01/2025',
    overageFee: 10.00,
    nextPaymentDate: '09/07/2025',
};

const SWITCHED_PLAN = {
    name: 'Advertising Growth',
    overage: '+2% of Ad Spend over $30,000',
    amount: 299.00,
    billingCycle: 'Monthly',
    nextPaymentDate: '09/02/2025',
};

const OVERDUE_PLAN = {
    name: 'Advertising Pro',
    overage: '+2% of Ad Spend over $50,000',
    amount: 449.00,
    billingCycle: 'Monthly',
    overageFee: 10.00,
};

const SUSPENDED_PLAN = {
    name: 'Advertising Pro',
    overage: '+2% of Ad Spend over $50,000',
    amount: 499.00,
    billingCycle: 'Monthly',
    overageFee: 0.00,
};





const MOCK_INVOICES_DETAILED = [
    { id: '#24759', plans: 'Advertising Pro', billingCycle: 'Monthly', amountPaid: 499.00, date: '10/01/2024', status: 'paid' },
    { id: '#24759', plans: 'Additional Ad Spend Fee', billingCycle: 'Monthly', amountPaid: 12.40, date: '10/05/2024', status: 'paid' },
    { id: '#24759', plans: 'Advertising Starter', billingCycle: 'Monthly', amountPaid: 99.00, date: '11/02/2024', status: 'paid' },
    { id: '#24759', plans: 'Additional Ad Spend Fee', billingCycle: 'Monthly', amountPaid: 23.50, date: '11/11/2024', status: 'paid' },
    { id: '#24759', plans: 'Add-on Service', billingCycle: 'Monthly', amountPaid: 99.00, date: '11/11/2024', status: 'paid', subText: 'Service Descriptions' },
    { id: '#24759', plans: 'Advertising Starter', billingCycle: 'Monthly', amountPaid: 499.00, date: '12/23/2024', status: 'paid' },
    { id: '#24759', plans: 'Additional Ad Spend Fee', billingCycle: 'Monthly', amountPaid: 25.90, date: '12/23/2024', status: 'paid' },
];

// --------------------------------------------------------------------------
// COMPONENTS
// --------------------------------------------------------------------------

function Breadcrumb() {
    return (
        <div className="flex items-center gap-2 text-gray-600 mb-2">
            <span className="text-lg font-medium">BQool Account</span>
            <ChevronRight size={16} />
            <span className="text-sm">Billing</span>
        </div>
    );
}

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-lg border border-[#e2e2e2] shadow-sm overflow-hidden flex flex-col ${className}`}>
            <div className="bg-[#f4f8fb] px-6 py-4 border-b border-[#e2e2e2]">
                <h2 className="text-[15px] font-bold text-gray-800">{title}</h2>
            </div>
            <div className="p-6 flex-1 flex flex-col">{children}</div>
        </div>
    );
}

function StatCell({ label, value, sub, className = "", isAlert = false, badge }: { label: string; value: string; sub?: string; className?: string; isAlert?: boolean; badge?: string }) {
    return (
        <div className={`flex flex-col gap-0.5 ${className}`}>
            <span className="text-[12px] text-[#ababab] font-medium">{label}</span>
            {value && <span className="text-[16px] font-bold text-gray-900">{value}</span>}

            {badge && (
                <div className="mt-1">
                    <span className="bg-[#fee2e2] text-[#ef4444] text-[11px] font-bold px-3 py-1 rounded">
                        {badge}
                    </span>
                </div>
            )}
            {sub && <span className={`text-[11px] mt-0.5 ${isAlert ? 'text-red-500' : 'text-gray-900'}`}>{sub}</span>}
        </div>
    );
}



function FreeTrialBar({ status, daysRemaining, totalDays }: {
    status: 'active' | 'expiring-today' | 'expired' | 'ended';
    daysRemaining: number;
    totalDays: number;
}) {
    const pct = Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));
    const label =
        status === 'active' ? `Expired in ${daysRemaining} days` :
            status === 'expiring-today' ? 'Expired today' :
                status === 'expired' ? 'Expired' : 'Ended';

    const barColor = (status === 'active' || status === 'expiring-today') ? 'bg-[#4aaada]' : (status === 'expired' ? 'bg-gray-200' : 'bg-[#ababab]');
    const textColor = (status === 'ended' || status === 'expired') ? 'text-gray-500' : 'text-gray-900';

    return (
        <div className="flex flex-col gap-1 mb-4">
            <span className="text-[12px] text-[#4aaada] font-medium">Free Trial</span>
            <span className={`text-[15px] font-bold ${textColor}`}>{label}</span>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mt-1">
                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------
// PLAN MODAL COMPONENTS
// --------------------------------------------------------------------------

interface PlanCardProps {
    name: string;
    monthlyPrice: number;
    annualPrice: number;
    billingCycle: 'monthly' | 'annual';
    adSpendLimit: string;
    isHighlighted?: boolean;
    isEnterprise?: boolean;
    isCurrent?: boolean;
    isSubscribed?: boolean;
    onSubscribe?: (data: { name: string; price: number; cycle: string; adSpendLimit: string }) => void;
    onCancelPlan?: () => void;
}

function PlanCard({
    name,
    monthlyPrice,
    annualPrice,
    billingCycle,
    adSpendLimit,
    isHighlighted = false,
    isEnterprise = false,
    isCurrent = false,
    isSubscribed = false,
    onSubscribe,
    onCancelPlan
}: PlanCardProps) {
    const price = billingCycle === 'monthly' ? monthlyPrice : annualPrice;

    return (
        <div className={`flex flex-col bg-white rounded-lg border p-8 transition-all ${isHighlighted ? 'border-[#4aaada] shadow-[0_4px_20px_rgba(74,170,218,0.15)] ring-1 ring-[#4aaada]' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
            <div className="flex-1 flex flex-col">
                <h3 className="text-[18px] font-medium text-gray-800 mb-4">{name}</h3>

                <div className="mb-6 h-28 flex flex-col justify-center">
                    {isEnterprise ? (
                        <span className="text-[32px] font-bold text-gray-900">Custom Pricing</span>
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <span className="text-[48px] font-bold text-gray-900">${price}</span>
                            <div className="flex flex-col">
                                <span className="text-[14px] text-gray-400 font-medium">per</span>
                                <span className="text-[14px] text-gray-400 font-medium leading-none text-[#4aaada]">month</span>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-[14px] text-gray-600 mb-8 font-medium">
                    +2% of Ad Spend over {adSpendLimit}
                </p>
            </div>

            <div className="flex flex-col">
                <button
                    disabled={isCurrent}
                    onClick={() => onSubscribe?.({
                        name,
                        price,
                        cycle: billingCycle === 'monthly' ? 'Monthly' : 'Annual',
                        adSpendLimit
                    })}
                    className={`w-full py-3 rounded-md font-bold text-[15px] transition-all ${isCurrent
                        ? 'bg-[#4aaada] text-white opacity-90 cursor-default'
                        : isHighlighted
                            ? 'bg-[#4aaada] text-white hover:bg-[#3a9aca] shadow-sm'
                            : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    {isCurrent ? 'Current Plan' : isEnterprise ? 'Contact Us' : isSubscribed ? 'Change Plan' : 'Subscribe Now'}
                </button>

                <div className="h-[70px] flex flex-col items-center justify-center gap-2">
                    {isCurrent && (
                        <button onClick={onCancelPlan} className="text-[13px] text-gray-400 hover:text-gray-600 underline">
                            Cancel Plan
                        </button>
                    )}
                    {!isCurrent && isHighlighted && !isSubscribed && (
                        <button className="text-[13px] text-gray-400 hover:text-gray-600 underline">
                            Cancel Free Trial
                        </button>
                    )}
                    <button className="text-[13px] text-gray-400 hover:text-gray-600 font-medium">
                        Learn More
                    </button>
                </div>
            </div>
        </div>
    );
}

function SubscriptionPlanModal({ isOpen, onClose, onSelectPlan, currentPlanName, isSubscribed }: {
    isOpen: boolean;
    onClose: () => void;
    onSelectPlan: (data: any) => void;
    currentPlanName?: string;
    isSubscribed?: boolean;
}) {
    const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-[1280px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-[#4aaada] px-6 py-4 flex items-center justify-between shrink-0">
                    <h2 className="text-white text-[18px] font-bold">BQool Advertising Subscription Plan</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={28} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-10 overflow-y-auto flex-1">
                    {/* Billing Toggle */}
                    <div className="flex justify-center mb-12">
                        <div className="bg-gray-100 p-1.5 rounded-lg flex items-center shadow-inner border border-gray-200">
                            <button
                                onClick={() => setCycle('monthly')}
                                className={`px-10 py-2.5 rounded-md text-[16px] font-bold transition-all ${cycle === 'monthly' ? 'bg-white text-[#2d336b] shadow-md' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setCycle('annual')}
                                className={`px-10 py-2.5 rounded-md text-[16px] font-bold transition-all flex items-center gap-2 ${cycle === 'annual' ? 'bg-white text-[#2d336b] shadow-md' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Annual
                                <span className="bg-[#e0e7ff] text-[#4f46e5] text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">Save 10%</span>
                            </button>
                        </div>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <PlanCard
                            name="Starter"
                            monthlyPrice={99}
                            annualPrice={89}
                            billingCycle={cycle}
                            adSpendLimit="$5,000"
                            isHighlighted={false}
                            isCurrent={currentPlanName === 'Starter'}
                            isSubscribed={isSubscribed}
                            onSubscribe={onSelectPlan}
                        />
                        <PlanCard
                            name="Growth"
                            monthlyPrice={299}
                            annualPrice={269}
                            billingCycle={cycle}
                            adSpendLimit="$30,000"
                            isCurrent={currentPlanName === 'Growth'}
                            isSubscribed={isSubscribed}
                            onSubscribe={onSelectPlan}
                        />
                        <PlanCard
                            name="Pro"
                            monthlyPrice={499}
                            annualPrice={449}
                            billingCycle={cycle}
                            adSpendLimit="$50,000"
                            isHighlighted={!currentPlanName}
                            isCurrent={currentPlanName === 'Pro'}
                            isSubscribed={isSubscribed}
                            onCancelPlan={() => { }}
                            onSubscribe={onSelectPlan}
                        />
                        <PlanCard
                            name="Enterprise"
                            monthlyPrice={0}
                            annualPrice={0}
                            billingCycle={cycle}
                            adSpendLimit="$50,000"
                            isEnterprise={true}
                            isSubscribed={isSubscribed}
                            onSubscribe={() => { }}
                        />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

// --------------------------------------------------------------------------
// MAIN CONTENT
// --------------------------------------------------------------------------

function CheckoutModal({ isOpen, onClose, selectedPlan, onConfirm, savedMethods, paymentMethodId, setPaymentMethodId, onAddCard, onAddPaypal, onRemoveMethod }: {
    isOpen: boolean;
    onClose: () => void;
    selectedPlan: any;
    onConfirm: () => void;
    savedMethods: any[];
    paymentMethodId: string;
    setPaymentMethodId: (id: string) => void;
    onAddCard: () => void;
    onAddPaypal: () => void;
    onRemoveMethod: (id: string) => void;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (savedMethods.length > 0) {
            const defaultMethod = savedMethods.find(m => m.isDefault) || savedMethods[0];
            setPaymentMethodId(defaultMethod.id);
        }
    }, [savedMethods]);

    if (!isOpen || !mounted || !selectedPlan) return null;

    const selectedMethod = savedMethods.find(m => m.id === paymentMethodId);

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-[1000px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="bg-[#4aaada] px-6 py-4 flex items-center justify-between shrink-0">
                    <h2 className="text-white text-[18px] font-bold">Subscribing Plan</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={28} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-8 overflow-y-auto flex-1 flex flex-col gap-8 bg-[#fdfdfd]">

                    {/* Payment Method Section */}
                    <div className="border border-[#e2e2e2] rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
                        <div className="bg-[#f4f8fb] px-6 py-3 border-b border-[#e2e2e2]">
                            <h3 className="text-[15px] font-bold text-gray-800">Payment Method</h3>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Slot 1: Credit Card */}
                                {savedMethods.find(m => m.type === 'card') ? (
                                    (() => {
                                        const method = savedMethods.find(m => m.type === 'card');
                                        return (
                                            <div
                                                onClick={() => setPaymentMethodId(method.id)}
                                                className={`border rounded-lg p-5 flex items-center gap-4 cursor-pointer transition-all ${paymentMethodId === method.id ? 'border-[#4aaada] bg-[#f4faff] ring-1 ring-[#4aaada]' : 'border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${paymentMethodId === method.id ? 'border-[#4aaada]' : 'border-gray-300'}`}>
                                                    {paymentMethodId === method.id && <div className="w-2.5 h-2.5 rounded-full bg-[#4aaada]" />}
                                                </div>
                                                <div className="w-12 h-9 bg-white rounded border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                                                    <div className="flex -space-x-2">
                                                        <div className="w-5 h-5 rounded-full bg-[#eb001b] opacity-90" />
                                                        <div className="w-5 h-5 rounded-full bg-[#f79e1b] opacity-90" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[14px] font-bold text-gray-900 leading-tight">{method.cardName}</p>
                                                    <p className="text-[12px] text-gray-400 mt-0.5">Ending in {method.cardNumber.slice(-4)}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onRemoveMethod(method.id); }}
                                                            className="text-[12px] text-red-500 font-bold hover:underline"
                                                        >
                                                            Remove
                                                        </button>
                                                        {method.isDefault && <span className="text-[12px] text-gray-900 font-bold ml-1">Default</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <button
                                        onClick={onAddCard}
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center gap-3 hover:border-[#4aaada] hover:bg-[#f4faff] transition-all group min-h-[110px]"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#4aaada]/10">
                                            <PlusCircle size={24} className="text-gray-400 group-hover:text-[#4aaada]" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[15px] font-bold text-gray-800">Add Credit Card</p>
                                            <p className="text-[12px] text-gray-400">Add credit card for payment</p>
                                        </div>
                                    </button>
                                )}

                                {/* Slot 2: PayPal */}
                                {savedMethods.find(m => m.type === 'paypal') ? (
                                    (() => {
                                        const method = savedMethods.find(m => m.type === 'paypal');
                                        return (
                                            <div
                                                onClick={() => setPaymentMethodId(method.id)}
                                                className={`border rounded-lg p-5 flex items-center gap-4 cursor-pointer transition-all ${paymentMethodId === method.id ? 'border-[#4aaada] bg-[#f4faff] ring-1 ring-[#4aaada]' : 'border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${paymentMethodId === method.id ? 'border-[#4aaada]' : 'border-gray-300'}`}>
                                                    {paymentMethodId === method.id && <div className="w-2.5 h-2.5 rounded-full bg-[#4aaada]" />}
                                                </div>
                                                <div className="w-12 h-9 bg-white rounded border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                                                    <Paypal className="text-[#003087]" size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[14px] font-bold text-gray-900 leading-tight">Paypal</p>
                                                    <p className="text-[12px] text-gray-400 mt-0.5">{method.email}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onRemoveMethod(method.id); }}
                                                            className="text-[12px] text-red-500 font-bold hover:underline"
                                                        >
                                                            Remove
                                                        </button>
                                                        {method.isDefault && <span className="text-[12px] text-gray-900 font-bold ml-1">Default</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <button
                                        onClick={onAddPaypal}
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center gap-3 hover:border-[#4aaada] hover:bg-[#f4faff] transition-all group min-h-[110px]"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#4aaada]/10">
                                            <Paypal size={24} className="text-gray-400 group-hover:text-[#4aaada]" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[15px] font-bold text-gray-800">Add Paypal</p>
                                            <p className="text-[12px] text-gray-400">Add paypal account for payment</p>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Subscription Details Section */}
                    <div className="border border-[#e2e2e2] rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
                        <div className="bg-[#f4f8fb] px-6 py-3 border-b border-[#e2e2e2]">
                            <h3 className="text-[15px] font-bold text-gray-800">Subscription Details</h3>
                        </div>
                        <div className="p-6 flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-y-6">
                                <div>
                                    <p className="text-[12px] text-[#ababab] font-medium uppercase mb-1">Plan</p>
                                    <p className="text-[20px] font-bold text-gray-900">{selectedPlan.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] text-[#ababab] font-medium uppercase mb-1">Billing Cycle</p>
                                    <p className="text-[20px] font-bold text-gray-900">{selectedPlan.cycle}</p>
                                </div>
                                <div>
                                    <p className="text-[12px] text-[#ababab] font-medium uppercase mb-1">Payment Effective Date</p>
                                    <p className="text-[18px] font-bold text-gray-900">09/18/2025 - 10/17/2025</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] text-[#ababab] font-medium uppercase mb-1">Amount</p>
                                    <p className="text-[22px] font-bold text-gray-900">${selectedPlan.price.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="bg-white border border-[#e2e2e2] rounded-lg overflow-hidden shadow-sm shrink-0">
                        <div className="flex flex-col">
                            {/* Subtotal */}
                            <div className="flex border-b border-[#f0f0f0]">
                                <div className="flex-1 p-4 flex justify-end items-center bg-gray-50 border-r border-[#f0f0f0]">
                                    <span className="text-[15px] font-medium text-gray-600">Subtotal</span>
                                </div>
                                <div className="w-[180px] p-4 flex justify-end items-center">
                                    <span className="text-[15px] font-bold text-gray-900">${selectedPlan.price.toFixed(2)}</span>
                                </div>
                            </div>
                            {/* Discount */}
                            <div className="flex border-b border-[#f0f0f0]">
                                <div className="flex-1 p-4 flex justify-end items-center bg-gray-50 border-r border-[#f0f0f0]">
                                    <span className="text-[15px] font-medium text-gray-600">Coupon/Discount</span>
                                </div>
                                <div className="w-[300px] p-2 flex items-center gap-2 border-r border-[#f0f0f0]">
                                    <input
                                        type="text"
                                        placeholder="#30405958 discount"
                                        className="flex-1 bg-white border border-gray-200 rounded px-3 py-2 text-[14px] outline-none focus:border-[#4aaada] transition-all"
                                    />
                                    <button className="bg-[#4aaada] hover:bg-[#3a9aca] text-white px-4 py-2 rounded font-bold text-[14px] transition-all">
                                        Save
                                    </button>
                                </div>
                                <div className="w-[180px] p-4 flex justify-end items-center">
                                    <span className="text-[15px] font-bold text-gray-900">$0.00</span>
                                </div>
                            </div>
                            {/* Total */}
                            <div className="flex bg-[#fcfdfe]">
                                <div className="flex-1 p-4 flex justify-end items-center bg-gray-50 border-r border-[#f0f0f0]">
                                    <span className="text-[16px] font-bold text-gray-800">Total</span>
                                </div>
                                <div className="w-[180px] p-4 flex justify-end items-center">
                                    <span className="text-[18px] font-bold text-[#4aaada]">${selectedPlan.price.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="p-6 border-t border-gray-100 flex flex-col gap-4 bg-white shrink-0">
                    {/* Terms */}
                    <p className="text-[13px] text-gray-400 text-center px-10">
                        By continuing <span className="text-[#0066b7] hover:underline cursor-pointer">you agree to our terms and conditions.</span> All fees are non-refundable. No exceptions will be made.
                    </p>

                    {/* Action */}
                    <div className="flex justify-center">
                        <button
                            onClick={onConfirm}
                            className="bg-[#4aaada] hover:bg-[#3a9aca] text-white text-[16px] font-bold px-12 py-3.5 rounded shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Confirm Payment
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

function ProcessingOverlay({ isOpen }: { isOpen: boolean }) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-[480px] h-[420px] flex flex-col items-center justify-center bg-gradient-to-b from-[#e1f0f8] via-[#d0e6f3] to-[#e1f0f8] rounded-xl shadow-2xl overflow-hidden relative border border-white/20">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes rotate-clockwise {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes rotate-counter-clockwise {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(-360deg); }
                    }
                    @keyframes fall {
                        0% { transform: translateY(-10px); opacity: 0; }
                        20% { opacity: 1; }
                        80% { opacity: 1; }
                        100% { transform: translateY(60px); opacity: 0; }
                    }
                    .animate-rotate-cw { animation: rotate-clockwise 3s linear infinite; }
                    .animate-rotate-ccw { animation: rotate-counter-clockwise 2s linear infinite; }
                    .falling-square { animation: fall 2.5s linear infinite; }
                `}} />

                {/* Main Visual */}
                <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                    {/* Outer Circle - Clockwise */}
                    <div className="absolute inset-0 border-[4px] border-transparent border-t-[#0066b7] border-r-[#0066b7] rounded-full animate-rotate-cw opacity-80" />
                    {/* Inner Circle - Counter Clockwise */}
                    <div className="absolute inset-5 border-[3px] border-transparent border-t-[#0066b7] border-l-[#0066b7] rounded-full animate-rotate-ccw opacity-60" />

                    {/* Credit Card Icon */}
                    <div className="relative z-10 text-[#0066b7]">
                        <CreditCard size={40} strokeWidth={1.5} />
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center mb-8 relative z-10">
                    <h2 className="text-white text-2xl font-bold tracking-wider mb-1 drop-shadow-md">
                        PROCESSING PAYMENT ....
                    </h2>
                    <p className="text-gray-500/80 text-[14px] font-medium tracking-wide">
                        Please do not refresh the browser
                    </p>
                </div>

                {/* Falling Squares Animation */}
                <div className="flex gap-3 items-start h-20">
                    {[...Array(5)].map((_, col) => (
                        <div key={col} className="flex flex-col gap-2" style={{ animationDelay: `${col * 0.2}s` }}>
                            {[...Array(4)].map((_, row) => (
                                <div
                                    key={row}
                                    className="w-2.5 h-2.5 border border-white/60 falling-square shrink-0"
                                    style={{
                                        animationDelay: `${(row * 0.5) + (col * 0.1)}s`,
                                        opacity: 0
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
}

function AddCardModal({ isOpen, onClose, onNext }: { isOpen: boolean; onClose: () => void; onNext: (data: any) => void }) {
    const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '', isDefault: true });
    const [errors, setErrors] = useState<Record<string, string>>({});
    if (!isOpen) return null;

    const handleAutoFill = () => {
        setCardData({
            number: '4235 0367 2289 5467',
            name: 'John Smith',
            expiry: '12/28',
            cvv: '231',
            isDefault: true
        });
        setErrors({});
    };

    const handleNext = () => {
        const newErrors: Record<string, string> = {};
        if (!cardData.number.trim()) newErrors.number = 'Card number is required.';
        if (!cardData.name.trim()) newErrors.name = 'Name on card is required.';
        if (!cardData.expiry.trim()) newErrors.expiry = 'Expiration date is required.';
        if (!cardData.cvv.trim()) newErrors.cvv = 'CVV is required.';
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) onNext(cardData);
    };

    const field = (key: keyof typeof cardData, value: string) => {
        setCardData(prev => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
    };

    return createPortal(
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-[800px] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-[#4aaada] px-6 py-4 flex items-center justify-between">
                    <h2 className="text-white text-[18px] font-bold">Adding Credit Card</h2>
                    <div className="flex items-center gap-4">
                        <button onClick={handleAutoFill} className="text-[12px] bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-sm border border-white/30 transition-all">Auto-fill</button>
                        <button onClick={onClose} className="text-white/80 hover:text-white"><X size={28} /></button>
                    </div>
                </div>
                <div className="p-8">
                    <div className="border border-gray-100 rounded-lg overflow-hidden mb-6">
                        <div className="bg-[#f4f8fb] px-6 py-4 border-b border-gray-100">
                            <span className="text-[16px] font-medium text-gray-800">Payment Information</span>
                        </div>
                        <div className="grid grid-cols-2">
                            <div className="p-6 border-r border-b border-gray-100">
                                <label className="block text-[14px] font-medium text-gray-600 mb-2">Card Number</label>
                                <input type="text" value={cardData.number} onChange={(e) => field('number', e.target.value)} placeholder="4235 0367 2289 5467" className={`w-full border rounded px-4 py-3 outline-none focus:border-[#4aaada] transition-all ${errors.number ? 'border-red-400' : 'border-gray-200'}`} />
                                {errors.number && <p className="text-red-500 text-[12px] mt-1 flex items-center gap-1"><ExclamationTriangleFill size={12} />{errors.number}</p>}
                            </div>
                            <div className="p-6 border-b border-gray-100">
                                <label className="block text-[14px] font-medium text-gray-600 mb-2">Name on Card</label>
                                <input type="text" value={cardData.name} onChange={(e) => field('name', e.target.value)} placeholder="John Smith" className={`w-full border rounded px-4 py-3 outline-none focus:border-[#4aaada] transition-all ${errors.name ? 'border-red-400' : 'border-gray-200'}`} />
                                {errors.name && <p className="text-red-500 text-[12px] mt-1 flex items-center gap-1"><ExclamationTriangleFill size={12} />{errors.name}</p>}
                            </div>
                            <div className="p-6 border-r border-gray-100">
                                <label className="block text-[14px] font-medium text-gray-600 mb-2">Expiration Date</label>
                                <input type="text" value={cardData.expiry} onChange={(e) => field('expiry', e.target.value)} placeholder="MM/YY" className={`w-full border rounded px-4 py-3 outline-none focus:border-[#4aaada] transition-all ${errors.expiry ? 'border-red-400' : 'border-gray-200'}`} />
                                {errors.expiry && <p className="text-red-500 text-[12px] mt-1 flex items-center gap-1"><ExclamationTriangleFill size={12} />{errors.expiry}</p>}
                            </div>
                            <div className="p-6">
                                <label className="block text-[14px] font-medium text-gray-600 mb-2">CVV</label>
                                <input type="text" value={cardData.cvv} onChange={(e) => field('cvv', e.target.value)} placeholder="231" className={`w-full border rounded px-4 py-3 outline-none focus:border-[#4aaada] transition-all ${errors.cvv ? 'border-red-400' : 'border-gray-200'}`} />
                                {errors.cvv && <p className="text-red-500 text-[12px] mt-1 flex items-center gap-1"><ExclamationTriangleFill size={12} />{errors.cvv}</p>}
                            </div>
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${cardData.isDefault ? 'bg-[#4aaada] border-[#4aaada]' : 'border-gray-300 bg-white group-hover:border-[#4aaada]'}`}>
                            {cardData.isDefault && <Check size={18} className="text-white" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={cardData.isDefault} onChange={(e) => setCardData({ ...cardData, isDefault: e.target.checked })} />
                        <span className="text-[15px] text-gray-400">Making this as default payment method</span>
                    </label>
                </div>
                <div className="px-8 py-5 border-t border-gray-50 flex justify-between bg-white">
                    <button onClick={onClose} className="flex items-center gap-2 px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-50 rounded transition-all"><X size={20} /> Cancel</button>
                    <button onClick={handleNext} className="bg-[#f0f9ff] text-[#0066b7] px-8 py-2.5 rounded font-bold hover:bg-[#e0f2fe] transition-all flex items-center gap-2 group">
                        Billing Information <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function AddBillingModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (data: any) => void }) {
    const [billingData, setBillingData] = useState({ name: '', lastName: '', company: '', address1: '', address2: '', city: '', state: '', zip: '', country: 'United States', isInvoice: true });
    const [showCountry, setShowCountry] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    if (!isOpen) return null;

    const countries = ['United States', 'Canada', 'United Kingdom', 'German', 'Japan'];

    // Required fields (address2 is optional)
    const REQUIRED: (keyof typeof billingData)[] = ['name', 'lastName', 'company', 'address1', 'city', 'state', 'zip'];
    const LABELS: Record<string, string> = { name: 'Name', lastName: 'Last Name', company: 'Company Name', address1: 'Address 1', city: 'City', state: 'State/Province', zip: 'Zipcode/Postal Code' };

    const handleAutoFill = () => {
        setBillingData({
            name: 'Peter',
            lastName: 'Smith',
            company: 'ABC Limited',
            address1: '13789 Street Rd. #8900',
            address2: '',
            city: 'New City',
            state: 'CA/London',
            zip: '70000',
            country: 'United States',
            isInvoice: true
        });
        setErrors({});
    };

    const handleSave = () => {
        const newErrors: Record<string, string> = {};
        REQUIRED.forEach(key => {
            if (!String((billingData as any)[key]).trim()) newErrors[key] = `${LABELS[key]} is required.`;
        });
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) onSave(billingData);
    };

    const updateField = (key: string, value: string) => {
        setBillingData(prev => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
    };

    return createPortal(
        <div className="fixed inset-0 z-[10003] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-[800px] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-[#4aaada] px-6 py-4 flex items-center justify-between">
                    <h2 className="text-white text-[18px] font-bold">Adding Billing Information</h2>
                    <div className="flex items-center gap-4">
                        <button onClick={handleAutoFill} className="text-[12px] bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-sm border border-white/30 transition-all">Auto-fill</button>
                        <button onClick={onClose} className="text-white/80 hover:text-white"><X size={28} /></button>
                    </div>
                </div>
                <div className="p-8">
                    <div className="border border-gray-100 rounded-sm overflow-hidden flex flex-col mb-6">
                        {[
                            { label: 'Name', key: 'name', type: 'text', half: true },
                            { label: 'Last Name', key: 'lastName', type: 'text', half: true },
                            { label: 'Company Name', key: 'company', type: 'text' },
                            { label: 'Address 2', key: 'address2', type: 'text' },
                            { label: 'Address 1', key: 'address1', type: 'text' },
                            { label: 'City', key: 'city', type: 'text' },
                            { label: 'State/Province', key: 'state', type: 'text' },
                            { label: 'Zipcode/Postal Code', key: 'zip', type: 'text' },
                        ].reduce((acc: any[], field, idx, arr) => {
                            if (field.half) {
                                if (field.key === 'name') {
                                    acc.push(
                                        <div key="name-row" className="flex border-b border-gray-100">
                                            <div className="w-[160px] bg-[#f4f8fb] p-4 font-medium text-gray-700 border-r border-gray-100">Name</div>
                                            <div className="flex-1 p-2 border-r border-gray-100">
                                                <input type="text" value={billingData.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Peter" className={`w-full border rounded px-3 py-2 outline-none ${errors.name ? 'border-red-400' : 'border-gray-200'}`} />
                                                {errors.name && <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1"><ExclamationTriangleFill size={11} />{errors.name}</p>}
                                            </div>
                                            <div className="w-[160px] bg-[#f4f8fb] p-4 font-medium text-gray-700 border-r border-gray-100">Last Name</div>
                                            <div className="flex-1 p-2">
                                                <input type="text" value={billingData.lastName} onChange={(e) => updateField('lastName', e.target.value)} placeholder="Smith" className={`w-full border rounded px-3 py-2 outline-none ${errors.lastName ? 'border-red-400' : 'border-gray-200'}`} />
                                                {errors.lastName && <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1"><ExclamationTriangleFill size={11} />{errors.lastName}</p>}
                                            </div>
                                        </div>
                                    );
                                }
                                return acc;
                            }
                            acc.push(
                                <div key={field.key} className="flex border-b border-gray-100">
                                    <div className="w-[160px] bg-[#f4f8fb] p-4 font-medium text-gray-700 border-r border-gray-100">{field.label}</div>
                                    <div className="flex-1 p-2">
                                        <input type="text" value={(billingData as any)[field.key]} onChange={(e) => updateField(field.key, e.target.value)} placeholder={field.key === 'company' ? 'ABC Limited' : ''} className={`w-full border rounded px-3 py-2 outline-none ${errors[field.key] ? 'border-red-400' : 'border-gray-200'}`} />
                                        {errors[field.key] && <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1"><ExclamationTriangleFill size={11} />{errors[field.key]}</p>}
                                    </div>
                                </div>
                            );
                            return acc;
                        }, [])}
                        <div className="flex">
                            <div className="w-[160px] bg-[#f4f8fb] p-4 font-medium text-gray-700 border-r border-gray-100">Country</div>
                            <div className="flex-1 p-2 relative">
                                <button onClick={() => setShowCountry(!showCountry)} className="w-full border border-gray-200 rounded px-3 py-2 text-left flex items-center justify-between text-gray-800">
                                    {billingData.country}
                                    <ChevronDown size={14} className={`transition-transform ${showCountry ? 'rotate-180' : ''}`} />
                                </button>
                                {showCountry && (
                                    <div className="absolute left-2 right-2 top-[calc(100%-8px)] z-20 bg-white border border-gray-100 shadow-xl rounded-md overflow-hidden animate-in fade-in slide-in-from-top-1">
                                        {countries.map(c => (
                                            <button key={c} onClick={() => { setBillingData({ ...billingData, country: c }); setShowCountry(false); }} className="w-full px-4 py-3 text-left hover:bg-[#f4faff] text-[15px] flex items-center justify-between group">
                                                {c}
                                                {billingData.country === c && <Check size={18} className="text-[#4aaada]" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${billingData.isInvoice ? 'bg-[#4aaada] border-[#4aaada]' : 'border-gray-300 bg-white group-hover:border-[#4aaada]'}`}>
                            {billingData.isInvoice && <Check size={18} className="text-white" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={billingData.isInvoice} onChange={(e) => setBillingData({ ...billingData, isInvoice: e.target.checked })} />
                        <span className="text-[15px] text-gray-400">Making this address as invoice address</span>
                    </label>
                </div>
                <div className="px-8 py-5 border-t border-gray-50 flex justify-between bg-white">
                    <button onClick={onClose} className="flex items-center gap-2 px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-50 rounded transition-all"><X size={20} /> Cancel</button>
                    <button onClick={handleSave} className="bg-[#4aaada] text-white px-10 py-2.5 rounded font-bold hover:bg-[#3a9aca] transition-all flex items-center gap-2 shadow-md">
                        <Check size={20} /> Save
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function AddPaypalModal({ isOpen, onClose, onSave, authorizedEmail, onLogin, onRemove }: { isOpen: boolean; onClose: () => void; onSave: (email: string) => void; authorizedEmail: string | null; onLogin: () => void; onRemove: () => void }) {
    const [isDefault, setIsDefault] = useState(true);
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-[800px] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-[#4aaada] px-6 py-4 flex items-center justify-between">
                    <h2 className="text-white text-[18px] font-bold">Adding Paypal Account</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white"><X size={28} /></button>
                </div>
                <div className="p-8">
                    <div className="border border-gray-100 rounded-lg overflow-hidden mb-6">
                        <div className="bg-[#f4f8fb] px-6 py-4 border-b border-gray-100">
                            <span className="text-[16px] font-medium text-gray-800">Payment Information</span>
                        </div>
                        <div className="p-8">
                            {!authorizedEmail ? (
                                <p className="text-[16px] text-gray-700">
                                    Click "Log in" to authorize your Paypal account. <button onClick={onLogin} className="text-[#0066b7] hover:underline font-bold">Log in</button>
                                </p>
                            ) : (
                                <p className="text-[16px] text-gray-900 font-medium flex items-center gap-2">
                                    {authorizedEmail} <button onClick={onLogin} className="text-[#0066b7] hover:underline text-[14px]">Edit</button>
                                </p>
                            )}
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${isDefault ? 'bg-[#4aaada] border-[#4aaada]' : 'border-gray-300 bg-white group-hover:border-[#4aaada]'}`}>
                            {isDefault && <Check size={18} className="text-white" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                        <span className="text-[15px] text-gray-400">Making this as default payment method</span>
                    </label>
                </div>
                <div className="px-8 py-5 border-t border-gray-50 flex justify-between bg-white">
                    <button onClick={onClose} className="flex items-center gap-2 px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-50 rounded transition-all"><X size={20} /> {authorizedEmail ? 'Cancel' : 'Close'}</button>
                    {authorizedEmail && (
                        <div className="flex gap-4">
                            <button onClick={onRemove} className="bg-red-50 text-red-500 px-8 py-2.5 rounded font-bold hover:bg-red-100 transition-all flex items-center gap-2"><Check size={20} /> Remove</button>
                            <button onClick={() => onSave(authorizedEmail)} className="bg-[#4aaada] text-white px-10 py-2.5 rounded font-bold hover:bg-[#3a9aca] transition-all flex items-center gap-2 shadow-md"><Check size={20} /> Save</button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

function PaypalMockLoginModal({ isOpen, onAuth }: { isOpen: boolean; onAuth: (email: string) => void }) {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[10004] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-[400px] flex flex-col items-center">
                <div className="w-full bg-white p-8 rounded-lg shadow-xl border border-gray-100">
                    <div className="flex justify-center mb-6">
                        <Paypal size={48} className="text-[#003087]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 font-sans">Paypal Mock Auth</h2>
                    <input type="email" placeholder="Email" className="w-full border border-gray-200 rounded p-3 mb-4 outline-none focus:border-[#003087]" defaultValue="peter.smith@gmail.com" />
                    <input type="password" placeholder="Password" className="w-full border border-gray-200 rounded p-3 mb-6 outline-none focus:border-[#003087]" defaultValue="********" />
                    <button onClick={() => onAuth('peter.smith@gmail.com')} className="w-full bg-[#0070ba] text-white py-3 rounded-full font-bold hover:bg-[#005ea6] transition-all">Mock Log In</button>
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-500">Demo only - Click to authorize</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

function AdSpendDetailsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[10006] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-[1000px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                {/* Header */}
                <div className="bg-[#4aaada] px-6 py-4 flex items-center justify-between">
                    <h2 className="text-white text-[18px] font-bold">Ad Spend Details</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={28} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="border border-[#e9f2f9] rounded-lg overflow-hidden">
                        <div className="bg-[#f0f7ff] px-6 py-4 border-b border-[#e9f2f9]">
                            <span className="text-[20px] font-medium text-gray-800">Billing Period: 10/01/2025 - 10/31/2025</span>
                        </div>
                        <div className="p-10 grid grid-cols-3 gap-y-12 gap-x-8">
                            <div>
                                <p className="text-[14px] text-[#94a3b8] mb-1.5">Monthly Ad Spend Included</p>
                                <p className="text-[24px] font-bold text-gray-900">$50,000</p>
                            </div>
                            <div>
                                <p className="text-[14px] text-[#94a3b8] mb-1.5">Current Ad Spend Amount</p>
                                <p className="text-[24px] font-bold text-gray-900">$51,000</p>
                            </div>
                            <div>
                                <p className="text-[14px] text-[#94a3b8] mb-1.5">Remaining Ad Spend Included</p>
                                <p className="text-[24px] font-bold text-gray-900">$0</p>
                            </div>
                            <div>
                                <p className="text-[14px] text-[#94a3b8] mb-1.5">Ad Spend Overage Amount</p>
                                <p className="text-[24px] font-bold text-gray-900">$1,000</p>
                            </div>
                            <div>
                                <p className="text-[14px] text-[#94a3b8] mb-1.5">Ad Spend Overage Rate</p>
                                <p className="text-[24px] font-bold text-gray-900">2%</p>
                            </div>
                            <div>
                                <p className="text-[14px] text-[#94a3b8] mb-1.5">Amount</p>
                                <p className="text-[24px] font-bold text-gray-900">$499.00</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-50 flex justify-center bg-gray-50/50">
                    <button onClick={onClose} className="bg-[#4aaada] hover:bg-[#3a9aca] text-white px-12 py-3 rounded font-bold shadow-md flex items-center gap-2 transition-all">
                        <Check size={20} /> OK
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function ChangePlanModal({
    isOpen,
    onClose,
    newPlan,
    currentPlan,
    onConfirm,
    savedMethods,
    paymentMethodId,
    setPaymentMethodId,
    onAddCard,
    onAddPaypal,
    onRemoveMethod
}: {
    isOpen: boolean;
    onClose: () => void;
    newPlan: any;
    currentPlan: any;
    onConfirm: () => void;
    savedMethods: any[];
    paymentMethodId: string;
    setPaymentMethodId: (id: string) => void;
    onAddCard: () => void;
    onAddPaypal: () => void;
    onRemoveMethod: (id: string) => void;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (savedMethods.length > 0) {
            const defaultMethod = savedMethods.find(m => m.isDefault) || savedMethods[0];
            setPaymentMethodId(defaultMethod.id);
        }
    }, [savedMethods]);

    if (!isOpen || !mounted || !newPlan || !currentPlan) return null;

    const credit = -42.90;
    const subtotal = (newPlan.price + credit).toFixed(2);

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-[1000px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="bg-[#4aaada] px-6 py-4 flex items-center justify-between shrink-0">
                    <h2 className="text-white text-[18px] font-bold">Change Plan</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X size={28} /></button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-8 overflow-y-auto flex-1 flex flex-col gap-8 bg-[#fdfdfd]">

                    {/* Payment Method Section */}
                    <div className="border border-[#e2e2e2] rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
                        <div className="bg-[#f4f8fb] px-6 py-3 border-b border-[#e2e2e2]">
                            <h3 className="text-[15px] font-bold text-gray-800">Payment Method</h3>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Slot 1: Credit Card */}
                                {savedMethods.find(m => m.type === 'card') ? (
                                    (() => {
                                        const method = savedMethods.find(m => m.type === 'card');
                                        return (
                                            <div
                                                onClick={() => setPaymentMethodId(method.id)}
                                                className={`border rounded-lg p-5 flex items-center gap-4 cursor-pointer transition-all ${paymentMethodId === method.id ? 'border-[#4aaada] bg-[#f4faff] ring-1 ring-[#4aaada]' : 'border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${paymentMethodId === method.id ? 'border-[#4aaada]' : 'border-gray-300'}`}>
                                                    {paymentMethodId === method.id && <div className="w-2.5 h-2.5 rounded-full bg-[#4aaada]" />}
                                                </div>
                                                <div className="w-12 h-9 bg-white rounded border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                                                    <div className="flex -space-x-2">
                                                        <div className="w-5 h-5 rounded-full bg-[#eb001b] opacity-90" />
                                                        <div className="w-5 h-5 rounded-full bg-[#f79e1b] opacity-90" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[14px] font-bold text-gray-900 leading-tight">{method.cardName}</p>
                                                    <p className="text-[12px] text-gray-400 mt-0.5">Ending in {method.cardNumber.slice(-4)}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <button onClick={(e) => { e.stopPropagation(); onRemoveMethod(method.id); }} className="text-[12px] text-red-500 font-bold hover:underline">Remove</button>
                                                        {method.isDefault && <span className="text-[12px] text-gray-900 font-bold ml-1">Default</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <button
                                        onClick={onAddCard}
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center gap-3 hover:border-[#4aaada] hover:bg-[#f4faff] transition-all group min-h-[110px]"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#4aaada]/10">
                                            <PlusCircle size={24} className="text-gray-400 group-hover:text-[#4aaada]" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[15px] font-bold text-gray-800">Add Credit Card</p>
                                            <p className="text-[12px] text-gray-400">Add credit card for payment</p>
                                        </div>
                                    </button>
                                )}

                                {/* Slot 2: PayPal */}
                                {savedMethods.find(m => m.type === 'paypal') ? (
                                    (() => {
                                        const method = savedMethods.find(m => m.type === 'paypal');
                                        return (
                                            <div
                                                onClick={() => setPaymentMethodId(method.id)}
                                                className={`border rounded-lg p-5 flex items-center gap-4 cursor-pointer transition-all ${paymentMethodId === method.id ? 'border-[#4aaada] bg-[#f4faff] ring-1 ring-[#4aaada]' : 'border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${paymentMethodId === method.id ? 'border-[#4aaada]' : 'border-gray-300'}`}>
                                                    {paymentMethodId === method.id && <div className="w-2.5 h-2.5 rounded-full bg-[#4aaada]" />}
                                                </div>
                                                <div className="w-12 h-9 bg-white rounded border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                                                    <Paypal className="text-[#003087]" size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[14px] font-bold text-gray-900 leading-tight">Paypal</p>
                                                    <p className="text-[12px] text-gray-400 mt-0.5">{method.email}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <button onClick={(e) => { e.stopPropagation(); onRemoveMethod(method.id); }} className="text-[12px] text-red-500 font-bold hover:underline">Remove</button>
                                                        {method.isDefault && <span className="text-[12px] text-gray-900 font-bold ml-1">Default</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <button
                                        onClick={onAddPaypal}
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center gap-3 hover:border-[#4aaada] hover:bg-[#f4faff] transition-all group min-h-[110px]"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#4aaada]/10">
                                            <Paypal size={24} className="text-gray-400 group-hover:text-[#4aaada]" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[15px] font-bold text-gray-800">Add Paypal</p>
                                            <p className="text-[12px] text-gray-400">Add paypal account for payment</p>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* New Subscription Section */}
                    <div className="border border-[#e2e2e2] rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
                        <div className="bg-[#f4f8fb] px-6 py-3 border-b border-[#e2e2e2]">
                            <h3 className="text-[15px] font-bold text-gray-800">New Subscription</h3>
                        </div>
                        <div className="p-6 flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-y-6">
                                <div>
                                    <p className="text-[12px] text-[#ababab] font-medium uppercase mb-1">Plan</p>
                                    <p className="text-[20px] font-bold text-gray-900">{newPlan.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] text-[#ababab] font-medium uppercase mb-1">Billing Cycle</p>
                                    <p className="text-[20px] font-bold text-gray-900">{newPlan.cycle}</p>
                                </div>
                                <div>
                                    <p className="text-[12px] text-[#ababab] font-medium uppercase mb-1">Payment Effective Date</p>
                                    <p className="text-[18px] font-bold text-gray-900">09/18/2025 - 10/17/2025</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] text-[#ababab] font-medium uppercase mb-1">Amount</p>
                                    <p className="text-[22px] font-bold text-gray-900">${newPlan.price.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Current Subscription Section */}
                    <div className="border border-[#e2e2e2] rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
                        <div className="bg-[#f4f8fb] px-6 py-3 border-b border-[#e2e2e2]">
                            <h3 className="text-[15px] font-bold text-gray-800">Current Subscription</h3>
                        </div>
                        <div className="p-6 flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-y-6">
                                <div>
                                    <p className="text-[12px] text-[#ababab] font-medium uppercase mb-1">Plan</p>
                                    <p className="text-[20px] font-bold text-gray-900">{currentPlan.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] text-[#ababab] font-medium uppercase mb-1">Billing Cycle</p>
                                    <p className="text-[20px] font-bold text-gray-900">{currentPlan.cycle}</p>
                                </div>
                                <div>
                                    <p className="text-[12px] text-[#ababab] font-medium uppercase mb-1">Payment Effective Date</p>
                                    <p className="text-[18px] font-bold text-gray-900">09/18/2025 - 09/30/2025</p>
                                </div>
                                <div className="grid grid-cols-2 col-span-1 text-right">
                                    <div>
                                        <p className="text-[12px] text-[#ababab] font-medium uppercase mb-1">Subscription Left</p>
                                        <p className="text-[18px] font-bold text-gray-900">13 days</p>
                                    </div>
                                    <div>
                                        <p className="text-[12px] text-[#ababab] font-medium uppercase mb-1">Credit</p>
                                        <p className="text-[18px] font-bold text-red-500">{credit.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="bg-white border border-[#e2e2e2] rounded-lg overflow-hidden shadow-sm shrink-0">
                        <div className="flex flex-col">
                            {/* Subtotal */}
                            <div className="flex border-b border-[#f0f0f0]">
                                <div className="flex-1 p-4 flex justify-end items-center bg-gray-50 border-r border-[#f0f0f0]">
                                    <span className="text-[15px] font-medium text-gray-600">Subtotal</span>
                                </div>
                                <div className="w-[180px] p-4 flex justify-end items-center">
                                    <span className="text-[15px] font-bold text-gray-900">${subtotal}</span>
                                </div>
                            </div>
                            {/* Discount */}
                            <div className="flex border-b border-[#f0f0f0]">
                                <div className="flex-1 p-4 flex justify-end items-center bg-gray-50 border-r border-[#f0f0f0]">
                                    <span className="text-[15px] font-medium text-gray-600">Coupon/Discount</span>
                                </div>
                                <div className="w-[300px] p-2 flex items-center gap-2 border-r border-[#f0f0f0]">
                                    <input
                                        type="text"
                                        placeholder="#30405958 discount"
                                        className="flex-1 bg-white border border-gray-200 rounded px-3 py-2 text-[14px] outline-none focus:border-[#4aaada] transition-all"
                                    />
                                    <button className="bg-[#4aaada] hover:bg-[#3a9aca] text-white px-4 py-2 rounded font-bold text-[14px] transition-all">
                                        Save
                                    </button>
                                </div>
                                <div className="w-[180px] p-4 flex justify-end items-center">
                                    <span className="text-[15px] font-bold text-gray-900">$0.00</span>
                                </div>
                            </div>
                            {/* Total */}
                            <div className="flex bg-[#fcfdfe]">
                                <div className="flex-1 p-4 flex justify-end items-center bg-gray-50 border-r border-[#f0f0f0]">
                                    <span className="text-[16px] font-bold text-gray-800">Total</span>
                                </div>
                                <div className="w-[180px] p-4 flex justify-end items-center">
                                    <span className="text-[18px] font-bold text-[#4aaada]">${subtotal}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer - Fixed */}
                <div className="p-6 border-t border-gray-100 flex flex-col gap-4 bg-white shrink-0">
                    {/* Terms */}
                    <p className="text-[13px] text-gray-400 text-center px-10">
                        By continuing <span className="text-[#0066b7] hover:underline cursor-pointer">you agree to our terms and conditions.</span> All fees are non-refundable. No exceptions will be made.
                    </p>
                    {/* Action */}
                    <div className="flex justify-center">
                        <button
                            onClick={onConfirm}
                            className="bg-[#4aaada] hover:bg-[#3a9aca] text-white text-[16px] font-bold px-12 py-3.5 rounded shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Confirm Payment
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

function SuccessModal({ isOpen, onClose, message = "Add Success" }: { isOpen: boolean; onClose: () => void; message?: string }) {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-[500px] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-[#4aaada] px-6 py-3 flex items-center justify-between">
                    <h2 className="text-white text-[16px] font-bold">Message</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white"><X size={20} /></button>
                </div>
                <div className="p-10 text-center">
                    <p className="text-[16px] text-gray-800 font-medium">{message}</p>
                </div>
                <div className="p-4 border-t border-gray-50 flex justify-center">
                    <button onClick={onClose} className="bg-[#4aaada] hover:bg-[#3a9aca] text-white px-8 py-2 rounded font-bold shadow-sm">OK</button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export function BillingContent() {
    const {
        billingData,
        loading: billingLoading,
        updateBilling,
        addPaymentMethod,
        removePaymentMethod,
        resetToFreeTrial
    } = useBilling();

    const {
        isSubscribed,
        trialDaysLeft,
        subscriberStatus,
        subscriptionDate,
        activePlan,
        previousPlan,
        savedPaymentMethods
    } = billingData;

    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [paymentMethodId, setPaymentMethodId] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [showAddSuccessModal, setShowAddSuccessModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    const [showAddCardModal, setShowAddCardModal] = useState(false);
    const [showAddBillingModal, setShowAddBillingModal] = useState(false);
    const [showAddPaypalModal, setShowAddPaypalModal] = useState(false);
    const [showPaypalLoginModal, setShowPaypalLoginModal] = useState(false);
    const [tempPaymentInfo, setTempPaymentInfo] = useState<any>(null);
    const [paypalAuthorizedEmail, setPaypalAuthorizedEmail] = useState<string | null>(null);

    const [showAdSpendModal, setShowAdSpendModal] = useState(false);
    const [showChangePlanModal, setShowChangePlanModal] = useState(false);
    const [showEditCardModal, setShowEditCardModal] = useState(false);
    const [editingCard, setEditingCard] = useState<any>(null);
    const [addedFromCheckout, setAddedFromCheckout] = useState(false);
    const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

    if (billingLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4aaada]"></div>
            </div>
        );
    }

    const handleSelectPlan = (planData: any) => {
        setSelectedPlan(planData);
        setShowPlanModal(false);
        if (isSubscribed) {
            setShowChangePlanModal(true);
        } else {
            setShowCheckoutModal(true);
        }
    };

    const handleConfirmPayment = () => {
        setShowCheckoutModal(false);
        setShowChangePlanModal(false);
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setShowMessageModal(true);
        }, 5000);
    };

    const handleMessageModalClose = () => {
        setShowMessageModal(false);

        if (isSubscribed && selectedPlan) {
            // Plan switch scenario
            updateBilling({
                previousPlan: activePlan,
                activePlan: {
                    ...selectedPlan,
                    name: selectedPlan.name,
                    amount: selectedPlan.price,
                    billingCycle: selectedPlan.cycle,
                    overage: `+2% of Ad Spend over ${selectedPlan.adSpendLimit}`,
                    overageFee: 0.00
                },
                subscriberStatus: 'switch'
            });
        } else if (selectedPlan) {
            // Initial subscription scenario
            updateBilling({
                isSubscribed: true,
                subscriptionDate: new Date(),
                activePlan: {
                    ...selectedPlan,
                    name: selectedPlan.name,
                    amount: selectedPlan.price,
                    billingCycle: selectedPlan.cycle,
                    overage: `+2% of Ad Spend over ${selectedPlan.adSpendLimit}`,
                    overageFee: 0.00
                },
                subscriberStatus: 'active'
            });
        } else {
            // Fallback
            updateBilling({
                isSubscribed: true,
                subscriptionDate: new Date(),
                subscriberStatus: 'active'
            });
        }
    };

    const handleAddCardNext = (cardData: any) => {
        setTempPaymentInfo(cardData);
        setShowAddCardModal(false);
        setShowAddBillingModal(true);
    };

    const handleSaveBilling = (billingData: any) => {
        const newMethod = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'card',
            ...tempPaymentInfo,
            ...billingData,
            isDefault: tempPaymentInfo.isDefault,
            cardNumber: tempPaymentInfo.number,
            cardName: tempPaymentInfo.name
        };

        addPaymentMethod(newMethod);
        setShowAddBillingModal(false);
        setShowAddSuccessModal(true);
    };

    const handlePaypalAuth = (email: string) => {
        setPaypalAuthorizedEmail(email);
        setShowPaypalLoginModal(false);
    };

    const handleSavePaypal = (email: string) => {
        // If editing an existing PayPal (addedFromCheckout=false and a paypal already exists), update in-place
        const isEditing = !addedFromCheckout && savedPaymentMethods.some((m: any) => m.type === 'paypal');
        if (isEditing) {
            updateBilling({
                savedPaymentMethods: savedPaymentMethods.map((m: any) => m.type === 'paypal' ? { ...m, email } : m)
            });
        } else {
            // Adding a brand new PayPal method
            const newMethod = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'paypal',
                email: email,
                isDefault: true
            };
            addPaymentMethod(newMethod);
        }
        setShowAddPaypalModal(false);
        setShowAddSuccessModal(true);
    };

    const handleRemoveMethod = (id: string) => {
        removePaymentMethod(id);
    };

    const handleEditCard = (method: any) => {
        setEditingCard(method);
        setShowEditCardModal(true);
    };

    const handleSaveEditedCard = (cardData: any, billingData: any) => {
        const updatedMethods = savedPaymentMethods.map((m: any) =>
            m.id === editingCard.id
                ? { ...m, ...billingData, cardNumber: cardData.number, cardName: cardData.name, expiry: cardData.expiry, cvv: cardData.cvv, isDefault: cardData.isDefault }
                : cardData.isDefault ? { ...m, isDefault: false } : m
        );
        updateBilling({ savedPaymentMethods: updatedMethods });
        setShowEditCardModal(false);
        setEditingCard(null);
    };

    const handleAddSuccessClose = () => {
        setShowAddSuccessModal(false);
        if (addedFromCheckout) {
            setShowCheckoutModal(true); // Return to checkout only when added from checkout flow
        }
        setAddedFromCheckout(false);
    };

    const handleResetToFreeTrial = () => {
        if (isSubscribed) {
            setShowResetConfirmModal(true);
        } else {
            doResetToFreeTrial();
        }
    };

    const doResetToFreeTrial = () => {
        resetToFreeTrial();
    };




    // Logic for single progress bar
    const totalTrialDays = 30;
    let trialStatus: 'active' | 'expiring-today' | 'expired' | 'ended' = 'active';
    let displayDays = typeof trialDaysLeft === 'number' ? trialDaysLeft : 0;

    if (trialDaysLeft === 'canceled') {
        trialStatus = 'ended';
        displayDays = 14; // Mock days left when canceled
    } else if (trialDaysLeft <= 0) {
        trialStatus = 'expired';
        displayDays = 0;
    } else if (trialDaysLeft <= 1) {
        trialStatus = 'expiring-today';
    }

    const pct = trialStatus === 'expired' ? 0 : Math.max(0, Math.min(100, (displayDays / totalTrialDays) * 100));
    const label =
        trialStatus === 'active' ? `Expired in ${Math.ceil(displayDays)} days` :
            trialStatus === 'expiring-today' ? 'Expired today' :
                trialStatus === 'expired' ? 'Expired' : 'Ended';

    const barColor = (trialStatus === 'active' || trialStatus === 'expiring-today') ? 'bg-[#4aaada]' : (trialStatus === 'expired' ? 'bg-gray-200' : 'bg-[#ababab]');
    const textColor = (trialStatus === 'ended' || trialStatus === 'expired') ? 'text-gray-500' : 'text-gray-900';


    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10 font-sans min-h-[calc(100vh-64px)]">
            <div className="flex justify-between items-center">
                <Breadcrumb />
                <div className="flex gap-4 items-center">
                    {isSubscribed && (
                        <div className="flex gap-2 items-center bg-gray-50 border border-gray-200 rounded px-2 py-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Status:</span>
                            <select
                                value={subscriberStatus}
                                onChange={(e) => updateBilling({ subscriberStatus: e.target.value as any })}
                                className="text-xs bg-transparent outline-none cursor-pointer font-bold text-gray-700"
                            >
                                <option value="active">Active</option>
                                <option value="cancel">Cancel</option>
                                <option value="switch">Switch</option>
                                <option value="overdue">Overdue</option>
                                <option value="suspended">Suspended</option>

                            </select>
                        </div>
                    )}
                    <button
                        onClick={handleResetToFreeTrial}
                        className="text-xs text-gray-400 hover:text-blue-500 transition-colors border border-gray-200 px-2 py-1 rounded"
                    >
                        Reset to Free Trial (Demo)
                    </button>

                </div>
            </div>


            {!isSubscribed ? (
                // --- FREE TRIAL VIEW ---
                <div className="flex flex-col gap-6">
                    <Section title="Subscription">
                        <div className="flex flex-col gap-10">
                            {/* Row 1: Plan, Amount, Subscribe Button */}
                            <div className="grid grid-cols-3 items-start">
                                <div className="justify-self-start">
                                    <StatCell label="Plan" value={FREE_TRIAL_PLAN.name} sub={FREE_TRIAL_PLAN.overage} />
                                </div>
                                <div className="justify-self-center w-full max-w-[200px]">
                                    <StatCell label="Amount" value={`$${FREE_TRIAL_PLAN.amount.toFixed(2)}/month`} />
                                </div>
                                <div className="justify-self-end">
                                    <button
                                        onClick={() => setShowPlanModal(true)}
                                        className="bg-[#4aaada] hover:bg-[#3a9aca] text-white text-[14px] font-bold px-6 py-2.5 rounded shadow-sm transition-all whitespace-nowrap"
                                    >
                                        Subscribe Now
                                    </button>
                                </div>
                            </div>

                            {/* Row 2: Ad Spend Stats */}
                            <div className="grid grid-cols-3 items-start">
                                <div className="justify-self-start">
                                    <StatCell label="Monthly Ad Spend Included" value={`$${FREE_TRIAL_PLAN.monthlyAdSpend.toLocaleString()}`} />
                                </div>
                                <div className="justify-self-center w-full max-w-[200px]">
                                    <StatCell label="Current Ad Spend Amount" value={`$${FREE_TRIAL_PLAN.currentAdSpend.toLocaleString()}`} />
                                </div>
                                <div className="justify-self-end w-full max-w-[200px]">
                                    <StatCell label="Remaining Ad Spend Included" value={`$${FREE_TRIAL_PLAN.remainingAdSpend.toLocaleString()}`} />
                                </div>
                            </div>

                            {/* Row 3: Overage Stats */}
                            <div className="grid grid-cols-3 items-start">
                                <div className="justify-self-start">
                                    <StatCell label="Ad Spend Overage Amount" value={`$${FREE_TRIAL_PLAN.overageAmount.toLocaleString()}`} />
                                </div>
                                <div className="justify-self-center w-full max-w-[200px]">
                                    <StatCell label="Ad Spend Overage Rate" value={`${FREE_TRIAL_PLAN.overageRate}%`} />
                                </div>
                                <div className="justify-self-end w-full max-w-[200px]">
                                    <StatCell label="Ad Spend Overage Fee" value={`$${FREE_TRIAL_PLAN.ovarageFee.toFixed(2)}`} sub="(No overage fees during the free trial period)" />
                                </div>
                            </div>


                            <div className="flex flex-col gap-6 border-t border-gray-100 pt-8">
                                <div className="flex flex-col gap-1 mb-4">
                                    <span className="text-[12px] text-[#4aaada] font-medium">Free Trial</span>
                                    <div className="flex justify-between items-end">
                                        <span className={`text-[15px] font-bold ${textColor}`}>{label}</span>
                                        <div className="flex gap-2 mb-1">
                                            <button onClick={() => updateBilling({ trialDaysLeft: 30 })} className="text-[10px] bg-gray-100 px-1 rounded text-gray-500 hover:bg-gray-200">Reset (30d)</button>
                                            <button onClick={() => updateBilling({ trialDaysLeft: 0.5 })} className="text-[10px] bg-gray-100 px-1 rounded text-gray-500 hover:bg-gray-200">Expiring Today</button>
                                            <button onClick={() => updateBilling({ trialDaysLeft: 0 })} className="text-[10px] bg-gray-100 px-1 rounded text-gray-500 hover:bg-gray-200">Expired</button>
                                            <button onClick={() => updateBilling({ trialDaysLeft: 'canceled' })} className="text-[10px] bg-gray-100 px-1 rounded text-gray-500 hover:bg-gray-200">Cancel Trial</button>
                                        </div>
                                    </div>
                                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mt-1">
                                        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>

            ) : (
                // --- SUBSCRIBER VIEW ---
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col lg:grid lg:grid-cols-[1.5fr_1fr] gap-6">
                        <div className="min-w-0">
                            <Section title="Subscription" className="h-full">
                                <div className="flex flex-col h-full">
                                    {subscriberStatus === 'active' && (
                                        <>
                                            <div className="grid grid-cols-4 gap-y-10 items-start">
                                                <div className="justify-self-start">
                                                    <StatCell label="Plan" value={activePlan?.name || ''} sub={activePlan?.overage || ''} />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Amount" value={`$${activePlan?.amount.toFixed(2) || '0.00'}/month`} />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Billing Cycle" value={activePlan?.billingCycle || ''} />
                                                </div>
                                                <div className="justify-self-end">
                                                    <StatCell
                                                        label="Next Payment Date"
                                                        value={subscriptionDate ? (subscriptionDate instanceof Date ? new Date(subscriptionDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'N/A') : activePlan?.nextPaymentDate || '10/18/2025'}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
                                                <StatCell label="Ad Spend Overage Fee" value={`$${activePlan?.overageFee.toFixed(2) || '0.00'}`} />
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setShowAdSpendModal(true)}
                                                        className="bg-[#f0f2f5] hover:bg-[#e4e6e9] text-gray-700 text-[14px] font-bold px-4 py-2 rounded transition-colors"
                                                    >
                                                        Ad Spend Details
                                                    </button>
                                                    <button
                                                        onClick={() => setShowPlanModal(true)}
                                                        className="bg-[#4aaada] hover:bg-[#3a9aca] text-white text-[14px] font-bold px-4 py-2 rounded shadow-sm transition-colors"
                                                    >
                                                        Change Plan
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {subscriberStatus === 'cancel' && (
                                        <div className="flex flex-col gap-10">
                                            <div className="grid grid-cols-4 items-start">
                                                <div className="justify-self-start">
                                                    <StatCell label="Plan" value={CANCELED_PLAN.name} sub={CANCELED_PLAN.overage} badge="Canceled" />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Amount" value={`$${CANCELED_PLAN.amount.toFixed(2)}/month`} />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Billing Cycle" value={CANCELED_PLAN.billingCycle} />
                                                </div>
                                                <div className="justify-self-end">
                                                    <StatCell label="Expiration Date" value={CANCELED_PLAN.expirationDate} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 items-end">
                                                <div className="justify-self-start">
                                                    <StatCell label="Ad Spend Overage Fee" value={`$${CANCELED_PLAN.overageFee.toFixed(2)}`} />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Next Payment Date" value={CANCELED_PLAN.nextPaymentDate} />
                                                </div>
                                                <div className="col-span-2 justify-self-end flex gap-3">
                                                    <button className="bg-[#f0f2f5] hover:bg-[#e4e6e9] text-gray-700 text-[14px] font-bold px-4 py-2 rounded transition-colors">
                                                        Ad Spend Details
                                                    </button>
                                                    <button className="bg-[#4aaada] hover:bg-[#3a9aca] text-white text-[14px] font-bold px-4 py-2 rounded shadow-sm transition-colors">
                                                        Resubscribe
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {subscriberStatus === 'switch' && (
                                        <div className="flex flex-col gap-4">
                                            {/* Current Plan Row (Canceled) */}
                                            <div className="grid grid-cols-4 items-start">
                                                <div className="justify-self-start">
                                                    <StatCell label="Plan" value={previousPlan.name} sub={previousPlan.overage} badge="Canceled" />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Amount" value={`$${previousPlan.amount.toFixed(2)}/month`} />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Billing Cycle" value={previousPlan.billingCycle} />
                                                </div>
                                                <div className="justify-self-end">
                                                    <StatCell label="Expiration Date" value={previousPlan.expirationDate || '09/01/2025'} />
                                                </div>
                                            </div>

                                            {/* New Plan Row */}
                                            <div className="grid grid-cols-4 items-start">
                                                <div className="justify-self-start">
                                                    <StatCell label="New Plan" value={activePlan?.name || ''} sub={activePlan?.overage || ''} />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Amount" value={`$${activePlan?.amount.toFixed(2) || '0.00'}/month`} />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Billing Cycle" value={activePlan?.billingCycle || ''} />
                                                </div>
                                                <div className="justify-self-end">
                                                    <StatCell
                                                        label="Next Payment Date"
                                                        value={subscriptionDate ? (subscriptionDate instanceof Date ? new Date(subscriptionDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'N/A') : activePlan?.nextPaymentDate || '10/18/2025'}
                                                    />
                                                </div>
                                            </div>

                                            {/* Overage and Actions Footer Row */}
                                            <div className="grid grid-cols-4 items-end">
                                                <div className="justify-self-start">
                                                    <StatCell label="Ad Spend Overage Fee" value={`$${previousPlan.overageFee?.toFixed(2) || '0.00'}`} />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Next Payment Date" value={previousPlan.nextPaymentDate || '09/07/2025'} />
                                                </div>
                                                <div className="col-span-2 justify-self-end flex gap-3">
                                                    <button className="bg-[#f0f2f5] hover:bg-[#e4e6e9] text-gray-700 text-[14px] font-bold px-4 py-2 rounded transition-colors">
                                                        Ad Spend Details
                                                    </button>
                                                    <button className="bg-[#4aaada] hover:bg-[#3a9aca] text-white text-[14px] font-bold px-4 py-2 rounded shadow-sm transition-colors">
                                                        Resubscribe
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {subscriberStatus === 'overdue' && (
                                        <div className="flex flex-col gap-10">
                                            <div className="grid grid-cols-4 items-start">
                                                <div className="justify-self-start">
                                                    <StatCell label="Plan" value={OVERDUE_PLAN.name} sub={OVERDUE_PLAN.overage} />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Amount" value={`$${OVERDUE_PLAN.amount.toFixed(2)}/month`} />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Billing Cycle" value={OVERDUE_PLAN.billingCycle} />
                                                </div>
                                                <div className="justify-self-end">
                                                    <StatCell label="Next Payment Date" value="" badge="Payment Overdue" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 items-end">
                                                <div className="justify-self-start">
                                                    <StatCell label="Ad Spend Overage Fee" value={`$${OVERDUE_PLAN.overageFee.toFixed(2)}`} />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Next Payment Date" value="" badge="Payment Overdue" />
                                                </div>
                                                <div className="col-span-2 justify-self-end flex gap-3">
                                                    <button className="bg-[#f0f2f5] hover:bg-[#e4e6e9] text-gray-700 text-[14px] font-bold px-4 py-2 rounded transition-colors">
                                                        Ad Spend Details
                                                    </button>
                                                    <button className="bg-[#4aaada] hover:bg-[#3a9aca] text-white text-[14px] font-bold px-4 py-2 rounded shadow-sm transition-colors">
                                                        Make Payment
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {subscriberStatus === 'suspended' && (
                                        <div className="flex flex-col gap-10">
                                            <div className="grid grid-cols-4 items-start">
                                                <div className="justify-self-start">
                                                    <StatCell label="Plan" value={SUSPENDED_PLAN.name} sub={SUSPENDED_PLAN.overage} />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Amount" value={`$${SUSPENDED_PLAN.amount.toFixed(2)}/month`} />
                                                </div>

                                                <div className="justify-self-start ml-4">
                                                    <StatCell label="Billing Cycle" value={SUSPENDED_PLAN.billingCycle} />
                                                </div>
                                                <div className="justify-self-start ml-4">
                                                    <StatCell
                                                        label="Next Payment Date"
                                                        value={subscriptionDate ? new Date(subscriptionDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : '10/18/2025'}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 items-end">
                                                <div className="justify-self-start">
                                                    <StatCell label="Ad Spend Overage Fee" value={`$${SUSPENDED_PLAN.overageFee.toFixed(2)}`} />
                                                </div>
                                                <div className="col-span-3 justify-self-end flex gap-3">
                                                    <button className="bg-[#f0f2f5] hover:bg-[#e4e6e9] text-gray-700 text-[14px] font-bold px-4 py-2 rounded transition-colors">
                                                        Ad Spend Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Section>
                        </div>
                        <div className="min-w-0">
                            <Section title="Payment Method" className="h-full">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 py-2">
                                    {/* Slot 1: Credit Card */}
                                    {savedPaymentMethods.find(m => m.type === 'card') ? (
                                        (() => {
                                            const method = savedPaymentMethods.find(m => m.type === 'card');
                                            return (
                                                <div className="border border-[#4aaada] rounded-lg p-5 flex items-center gap-4 bg-[#f4faff] relative shadow-[0_2px_8px_rgba(74,170,218,0.1)] min-h-[110px]">
                                                    <div className="w-12 h-9 bg-white rounded border border-gray-100 flex items-center justify-center shrink-0">
                                                        <div className="flex -space-x-2">
                                                            <div className="w-5 h-5 rounded-full bg-[#eb001b] opacity-90" />
                                                            <div className="w-5 h-5 rounded-full bg-[#f79e1b] opacity-90" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[14px] font-bold text-gray-900 leading-tight whitespace-nowrap">{method.cardName}</p>
                                                        <p className="text-[12px] text-gray-400 mt-0.5">Ending in {method.cardNumber.slice(-4)}</p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <button
                                                                onClick={() => handleEditCard(method)}
                                                                className="text-[12px] text-blue-500 font-bold hover:underline"
                                                            >
                                                                Edit
                                                            </button>
                                                            {method.isDefault && <span className="text-[12px] text-gray-900 font-bold ml-1">Default</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div
                                            onClick={() => setShowAddCardModal(true)}
                                            className="border border-gray-200 rounded-lg p-5 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 transition-colors cursor-pointer border-dashed min-h-[110px]"
                                        >
                                            <PlusCircle className="text-gray-400" size={20} />
                                            <span className="text-[14px] font-bold text-[#94a3b8]">Add Credit Card</span>
                                        </div>
                                    )}

                                    {/* Slot 2: PayPal */}
                                    {savedPaymentMethods.find(m => m.type === 'paypal') ? (
                                        (() => {
                                            const method = savedPaymentMethods.find(m => m.type === 'paypal');
                                            return (
                                                <div className="border border-gray-200 rounded-lg p-5 flex items-center gap-4 bg-white relative shadow-[0_1px_4px_rgba(0,0,0,0.02)] min-h-[110px]">
                                                    <div className="w-12 h-9 bg-white rounded border border-gray-100 flex items-center justify-center shrink-0">
                                                        <Paypal className="text-[#003087]" size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[14px] font-bold text-gray-900 leading-tight">Paypal</p>
                                                        <p className="text-[12px] text-gray-400 mt-0.5">{method.email}</p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <button
                                                                onClick={() => { setShowAddPaypalModal(true); }}
                                                                className="text-[12px] text-blue-500 font-bold hover:underline"
                                                            >
                                                                Edit
                                                            </button>
                                                            {method.isDefault && <span className="text-[12px] text-gray-900 font-bold ml-1">Default</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div
                                            onClick={() => setShowAddPaypalModal(true)}
                                            className="border border-[#bde0f2] rounded-lg p-5 flex items-center justify-center gap-3 bg-[#f4faff] hover:bg-[#e9f5ff] transition-colors cursor-pointer border-dashed min-h-[110px]"
                                        >
                                            <PlusCircle className="text-[#94a3b8]" size={20} />
                                            <span className="text-[14px] font-bold text-[#94a3b8]">Add Paypal Account</span>
                                        </div>
                                    )}
                                </div>
                            </Section>
                        </div>
                    </div>


                    <div className="flex flex-col gap-5 mt-4">
                        <h2 className="text-[15px] font-bold text-gray-800 px-1">Invoices</h2>

                        {/* Filters */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center shadow-sm rounded-md h-[40px] overflow-hidden border border-gray-200">
                                <div className="flex flex-col bg-[#f8fbff] border-r border-gray-200 px-3 justify-center h-full">
                                    <span className="text-[10px] text-[#ababab] font-bold uppercase tracking-wider">Date</span>
                                </div>
                                <select className="h-full px-3 text-sm text-gray-700 outline-none w-[180px] bg-white cursor-pointer hover:bg-gray-50 transition-colors">
                                    <option>Last 6 Months</option>
                                    <option>Last 12 Months</option>
                                    <option>2024</option>
                                    <option>2023</option>
                                </select>
                                <button className="h-full px-4 bg-[#4aaada] text-white hover:bg-[#3a9aca] transition-colors border-l border-[#4aaada]">
                                    <Search size={16} />
                                </button>
                            </div>
                            <button className="text-sm text-blue-500 font-bold hover:underline">Edit Invoice Address</button>
                        </div>

                        {/* Invoices Table */}
                        <div className="bg-white rounded-lg border border-[#e2e2e2] shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#f4f8fb] text-gray-700 font-bold border-b border-[#e2e2e2]">
                                    <tr>
                                        <th className="px-6 py-4 border-r border-[#e2e2e2] w-[120px]">Invoice#</th>
                                        <th className="px-6 py-4 border-r border-[#e2e2e2]">Plans</th>
                                        <th className="px-6 py-4 border-r border-[#e2e2e2] text-center w-[150px]">Billing Cycle</th>
                                        <th className="px-6 py-4 border-r border-[#e2e2e2] text-right w-[150px]">Amount Paid</th>
                                        <th className="px-6 py-4 border-r border-[#e2e2e2] text-center w-[150px]">Invoice Date</th>
                                        <th className="px-6 py-4 text-center w-[100px]">Actions</th>

                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {MOCK_INVOICES_DETAILED.map((inv, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 border-r border-[#e2e2e2] font-medium text-gray-900">{inv.id}</td>
                                            <td className="px-6 py-4 border-r border-[#e2e2e2]">
                                                <div>
                                                    <p className="text-gray-900 font-medium">{inv.plans}</p>
                                                    {inv.subText && <p className="text-[11px] text-[#4aaada] font-medium">{inv.subText}</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border-r border-[#e2e2e2] text-center text-gray-700">{inv.billingCycle}</td>
                                            <td className="px-6 py-4 border-r border-[#e2e2e2] text-right font-bold text-gray-900">${inv.amountPaid.toFixed(2)}</td>
                                            <td className="px-6 py-4 border-r border-[#e2e2e2] text-center text-gray-700">{inv.date}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="text-blue-500 font-bold text-xs hover:underline inline-flex items-center gap-1 group-hover:drop-shadow-sm">
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Pagination */}
                            <div className="bg-white px-6 py-3 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500 font-medium">
                                <div className="flex items-center gap-2">
                                    <span>Display</span>
                                    <select className="border border-gray-200 rounded px-2 py-1 outline-none cursor-pointer focus:border-blue-300">
                                        <option>25</option>
                                        <option>50</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span>20 Results, Page <input type="number" defaultValue={1} className="w-8 border border-gray-200 rounded text-center py-1 mx-1 focus:border-blue-300 outline-none" /> of 5</span>
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">&lt;</button>
                                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">&gt;</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <SubscriptionPlanModal
                isOpen={showPlanModal}
                onClose={() => setShowPlanModal(false)}
                onSelectPlan={handleSelectPlan}
                currentPlanName={isSubscribed ? (selectedPlan?.name || 'Growth') : undefined}
                isSubscribed={isSubscribed}
            />

            <CheckoutModal
                isOpen={showCheckoutModal}
                onClose={() => setShowCheckoutModal(false)}
                selectedPlan={selectedPlan || FREE_TRIAL_PLAN}
                savedMethods={savedPaymentMethods}
                paymentMethodId={paymentMethodId}
                setPaymentMethodId={setPaymentMethodId}
                onAddCard={() => { setAddedFromCheckout(true); setShowAddCardModal(true); }}
                onAddPaypal={() => { setAddedFromCheckout(true); setShowAddPaypalModal(true); }}
                onRemoveMethod={handleRemoveMethod}
                onConfirm={handleConfirmPayment}
            />

            <ChangePlanModal
                isOpen={showChangePlanModal}
                onClose={() => setShowChangePlanModal(false)}
                newPlan={selectedPlan}
                currentPlan={{ name: 'Starter', cycle: 'Monthly', price: 99.00 }}
                onConfirm={handleConfirmPayment}
                savedMethods={savedPaymentMethods}
                paymentMethodId={paymentMethodId}
                setPaymentMethodId={setPaymentMethodId}
                onAddCard={() => { setAddedFromCheckout(true); setShowAddCardModal(true); }}
                onAddPaypal={() => { setAddedFromCheckout(true); setShowAddPaypalModal(true); }}
                onRemoveMethod={handleRemoveMethod}
            />

            <AdSpendDetailsModal
                isOpen={showAdSpendModal}
                onClose={() => setShowAdSpendModal(false)}
            />

            <AddCardModal
                isOpen={showAddCardModal}
                onClose={() => setShowAddCardModal(false)}
                onNext={handleAddCardNext}
            />

            <AddBillingModal
                isOpen={showAddBillingModal}
                onClose={() => setShowAddBillingModal(false)}
                onSave={handleSaveBilling}
            />

            <AddPaypalModal
                isOpen={showAddPaypalModal}
                onClose={() => { setShowAddPaypalModal(false); setAddedFromCheckout(false); }}
                onSave={handleSavePaypal}
                authorizedEmail={paypalAuthorizedEmail}
                onLogin={() => setShowPaypalLoginModal(true)}
                onRemove={() => setPaypalAuthorizedEmail(null)}
            />

            <PaypalMockLoginModal
                isOpen={showPaypalLoginModal}
                onAuth={handlePaypalAuth}
            />

            <SuccessModal
                isOpen={showAddSuccessModal}
                onClose={handleAddSuccessClose}
            />

            <EditCardModal
                isOpen={showEditCardModal}
                onClose={() => { setShowEditCardModal(false); setEditingCard(null); }}
                existingCard={editingCard}
                onSave={handleSaveEditedCard}
            />

            {/* Reset to Free Trial Confirmation Modal */}
            {showResetConfirmModal && createPortal(
                <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-[480px] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#4aaada] px-6 py-4 flex items-center justify-between">
                            <h2 className="text-white text-[17px] font-bold">Reset to Free Trial (Demo)</h2>
                            <button onClick={() => setShowResetConfirmModal(false)} className="text-white/80 hover:text-white transition-colors"><X size={24} /></button>
                        </div>
                        <div className="p-8 flex flex-col gap-6">
                            <p className="text-[15px] text-gray-700 leading-relaxed">
                                This will <span className="font-bold text-gray-900">permanently erase</span> your current subscription and all saved payment methods, resetting the billing page to its initial Free Trial state.
                            </p>
                            <p className="text-[13px] text-gray-400">This is a demo action only and does not affect any real data.</p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowResetConfirmModal(false)}
                                    className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-50 rounded border border-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={doResetToFreeTrial}
                                    className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded transition-all shadow-sm"
                                >
                                    Confirm Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <ProcessingOverlay isOpen={isProcessing} />

            <MessageModal
                isOpen={showMessageModal}
                onClose={handleMessageModalClose}
            />
        </div >
    );
}

// --------------------------------------------------------------------------
// EDIT CARD MODAL
// --------------------------------------------------------------------------

function EditCardModal({ isOpen, onClose, existingCard, onSave }: {
    isOpen: boolean;
    onClose: () => void;
    existingCard: any;
    onSave: (cardData: any, billingData: any) => void;
}) {
    const [step, setStep] = useState<'card' | 'billing'>('card');
    const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '', isDefault: true });
    const [billingData, setBillingData] = useState({ name: '', lastName: '', company: '', address1: '', address2: '', city: '', state: '', zip: '', country: 'United States', isInvoice: true });
    const [showCountry, setShowCountry] = useState(false);
    const countries = ['United States', 'Canada', 'United Kingdom', 'German', 'Japan'];

    // Pre-fill from existing card whenever modal opens
    useEffect(() => {
        if (isOpen && existingCard) {
            setStep('card');
            setCardData({
                number: existingCard.cardNumber || '',
                name: existingCard.cardName || '',
                expiry: existingCard.expiry || '',
                cvv: existingCard.cvv || '',
                isDefault: existingCard.isDefault ?? true,
            });
            setBillingData({
                name: existingCard.name || '',
                lastName: existingCard.lastName || '',
                company: existingCard.company || '',
                address1: existingCard.address1 || '',
                address2: existingCard.address2 || '',
                city: existingCard.city || '',
                state: existingCard.state || '',
                zip: existingCard.zip || '',
                country: existingCard.country || 'United States',
                isInvoice: existingCard.isInvoice ?? true,
            });
        }
    }, [isOpen, existingCard]);

    if (!isOpen || !existingCard) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-[800px] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-[#4aaada] px-6 py-4 flex items-center justify-between">
                    <h2 className="text-white text-[18px] font-bold">
                        {step === 'card' ? 'Editing Credit Card' : 'Editing Billing Information'}
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white"><X size={28} /></button>
                </div>

                {step === 'card' ? (
                    /* ---- Card Info Step ---- */
                    <>
                        <div className="p-8">
                            <div className="border border-gray-100 rounded-lg overflow-hidden mb-6">
                                <div className="bg-[#f4f8fb] px-6 py-4 border-b border-gray-100">
                                    <span className="text-[16px] font-medium text-gray-800">Payment Information</span>
                                </div>
                                <div className="grid grid-cols-2">
                                    <div className="p-6 border-r border-b border-gray-100">
                                        <label className="block text-[14px] font-medium text-gray-600 mb-2">Card Number</label>
                                        <input type="text" value={cardData.number} onChange={(e) => setCardData({ ...cardData, number: e.target.value })} placeholder="4235 0367 2289 5467" className="w-full border border-gray-200 rounded px-4 py-3 outline-none focus:border-[#4aaada] transition-all" />
                                    </div>
                                    <div className="p-6 border-b border-gray-100">
                                        <label className="block text-[14px] font-medium text-gray-600 mb-2">Name on Card</label>
                                        <input type="text" value={cardData.name} onChange={(e) => setCardData({ ...cardData, name: e.target.value })} placeholder="John Smith" className="w-full border border-gray-200 rounded px-4 py-3 outline-none focus:border-[#4aaada] transition-all" />
                                    </div>
                                    <div className="p-6 border-r border-gray-100">
                                        <label className="block text-[14px] font-medium text-gray-600 mb-2">Expiration Date</label>
                                        <input type="text" value={cardData.expiry} onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })} placeholder="MM/YY" className="w-full border border-gray-200 rounded px-4 py-3 outline-none focus:border-[#4aaada] transition-all" />
                                    </div>
                                    <div className="p-6">
                                        <label className="block text-[14px] font-medium text-gray-600 mb-2">CVV</label>
                                        <input type="text" value={cardData.cvv} onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })} placeholder="231" className="w-full border border-gray-200 rounded px-4 py-3 outline-none focus:border-[#4aaada] transition-all" />
                                    </div>
                                </div>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${cardData.isDefault ? 'bg-[#4aaada] border-[#4aaada]' : 'border-gray-300 bg-white group-hover:border-[#4aaada]'}`}>
                                    {cardData.isDefault && <Check size={18} className="text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={cardData.isDefault} onChange={(e) => setCardData({ ...cardData, isDefault: e.target.checked })} />
                                <span className="text-[15px] text-gray-400">Making this as default payment method</span>
                            </label>
                        </div>
                        <div className="px-8 py-5 border-t border-gray-50 flex justify-between bg-white">
                            <button onClick={onClose} className="flex items-center gap-2 px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-50 rounded transition-all"><X size={20} /> Cancel</button>
                            <button onClick={() => setStep('billing')} className="bg-[#f0f9ff] text-[#0066b7] px-8 py-2.5 rounded font-bold hover:bg-[#e0f2fe] transition-all flex items-center gap-2 group">
                                Billing Information <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </>
                ) : (
                    /* ---- Billing Info Step ---- */
                    <>
                        <div className="p-8">
                            <div className="border border-gray-100 rounded-sm overflow-hidden flex flex-col mb-6">
                                {[
                                    { label: 'Name', key: 'name', half: true },
                                    { label: 'Last Name', key: 'lastName', half: true },
                                    { label: 'Company Name', key: 'company' },
                                    { label: 'Address 2', key: 'address2' },
                                    { label: 'Address 1', key: 'address1' },
                                    { label: 'City', key: 'city' },
                                    { label: 'State/Province', key: 'state' },
                                    { label: 'Zipcode/Postal Code', key: 'zip' },
                                ].reduce((acc: any[], field) => {
                                    if (field.half) {
                                        if (field.key === 'name') {
                                            acc.push(
                                                <div key="name-row" className="flex border-b border-gray-100">
                                                    <div className="w-[160px] bg-[#f4f8fb] p-4 font-medium text-gray-700 border-r border-gray-100">Name</div>
                                                    <div className="flex-1 p-2 border-r border-gray-100"><input type="text" value={billingData.name} onChange={(e) => setBillingData({ ...billingData, name: e.target.value })} placeholder="Peter" className="w-full border border-gray-200 rounded px-3 py-2 outline-none" /></div>
                                                    <div className="w-[160px] bg-[#f4f8fb] p-4 font-medium text-gray-700 border-r border-gray-100">Last Name</div>
                                                    <div className="flex-1 p-2"><input type="text" value={billingData.lastName} onChange={(e) => setBillingData({ ...billingData, lastName: e.target.value })} placeholder="Smith" className="w-full border border-gray-200 rounded px-3 py-2 outline-none" /></div>
                                                </div>
                                            );
                                        }
                                        return acc;
                                    }
                                    acc.push(
                                        <div key={field.key} className="flex border-b border-gray-100">
                                            <div className="w-[160px] bg-[#f4f8fb] p-4 font-medium text-gray-700 border-r border-gray-100">{field.label}</div>
                                            <div className="flex-1 p-2"><input type="text" value={(billingData as any)[field.key]} onChange={(e) => setBillingData({ ...billingData, [field.key]: e.target.value })} className="w-full border border-gray-200 rounded px-3 py-2 outline-none" /></div>
                                        </div>
                                    );
                                    return acc;
                                }, [])}
                                <div className="flex">
                                    <div className="w-[160px] bg-[#f4f8fb] p-4 font-medium text-gray-700 border-r border-gray-100">Country</div>
                                    <div className="flex-1 p-2 relative">
                                        <button onClick={() => setShowCountry(!showCountry)} className="w-full border border-gray-200 rounded px-3 py-2 text-left flex items-center justify-between text-gray-800">
                                            {billingData.country}
                                            <ChevronDown size={14} className={`transition-transform ${showCountry ? 'rotate-180' : ''}`} />
                                        </button>
                                        {showCountry && (
                                            <div className="absolute left-2 right-2 top-[calc(100%-8px)] z-20 bg-white border border-gray-100 shadow-xl rounded-md overflow-hidden animate-in fade-in slide-in-from-top-1">
                                                {countries.map(c => (
                                                    <button key={c} onClick={() => { setBillingData({ ...billingData, country: c }); setShowCountry(false); }} className="w-full px-4 py-3 text-left hover:bg-[#f4faff] text-[15px] flex items-center justify-between group">
                                                        {c}
                                                        {billingData.country === c && <Check size={18} className="text-[#4aaada]" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${billingData.isInvoice ? 'bg-[#4aaada] border-[#4aaada]' : 'border-gray-300 bg-white group-hover:border-[#4aaada]'}`}>
                                    {billingData.isInvoice && <Check size={18} className="text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={billingData.isInvoice} onChange={(e) => setBillingData({ ...billingData, isInvoice: e.target.checked })} />
                                <span className="text-[15px] text-gray-400">Making this address as invoice address</span>
                            </label>
                        </div>
                        <div className="px-8 py-5 border-t border-gray-50 flex justify-between bg-white">
                            <button onClick={() => setStep('card')} className="flex items-center gap-2 px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-50 rounded transition-all"><ChevronRight size={20} className="rotate-180" /> Back</button>
                            <button onClick={() => onSave(cardData, billingData)} className="bg-[#4aaada] text-white px-10 py-2.5 rounded font-bold hover:bg-[#3a9aca] transition-all flex items-center gap-2 shadow-md">
                                <Check size={20} /> Save
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}

function MessageModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-[800px] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-[#4aaada] px-6 py-4 flex items-center justify-between">
                    <h2 className="text-white text-[18px] font-bold">Message</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-12">
                    <div className="border border-gray-100 rounded-sm p-12 text-center">
                        <p className="text-[18px] text-gray-800 font-medium leading-relaxed">
                            Thank you for subscribing our services!<br />
                            Your payment has been successfully confirmed!
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-50 flex justify-center pb-8">
                    <button
                        onClick={onClose}
                        className="bg-[#4aaada] hover:bg-[#3a9aca] text-white px-8 py-3 rounded flex items-center gap-2 font-bold shadow-md transition-all active:scale-95"
                    >
                        <Check size={20} />
                        OK
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

