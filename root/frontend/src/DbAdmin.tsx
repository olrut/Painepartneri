import React from 'react';

const DbAdmin: React.FC = () => {
  const src = 'http://localhost:5050';
  return (
    <div className="w-full h-screen pt-16">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Tietokannan hallinta (pgAdmin)</h1>
        <p className="mb-4 text-gray-600">
          {' '}<a className="text-indigo-600 underline" href={src} target="_blank" rel="noreferrer">Avaa pgAdmin</a>
        </p>
      </div>
    </div>
  );
};

export default DbAdmin;
