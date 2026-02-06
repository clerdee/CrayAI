// src/components/admin/StatCard.jsx
import React from 'react';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">{title}</p>
            <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
        </div>
    </div>
);

export default StatCard;