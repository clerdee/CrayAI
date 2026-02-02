import React from 'react';

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-slate-100 group">
      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl mb-4 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
        {icon}
      </div>
      <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;