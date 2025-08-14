import React, { useEffect, useState } from 'react';
function Reports({ token }) {
const [transactions, setTransactions] = useState([]);
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
const [loading, setLoading] = useState(false);

  useEffect(() => {
    // const fetchTransactions = async () => {
    //   try {
    //     const response = await fetch('http://localhost:5000/api/reports/transactions', {
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //       },
    //     });

    //     const data = await response.json();
    //     if (Array.isArray(data)) {
    //       setTransactions(data);
    //     } else {
    //       setTransactions([]); // fallback if response is not an array
    //     }
    //   } catch (err) {
    //     console.error('Error fetching reports:', err);
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    fetchTransactions();
  }, [token]);
  const fetchTransactions = async () => {
  setLoading(true);
  try {
    let url = 'http://localhost:5000/api/reports/transactions';

    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (Array.isArray(data)) {
      setTransactions(data);
    } else {
      setTransactions([]);
    }
  } catch (err) {
    console.error('Error fetching reports:', err);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return <p className="text-gray-500">Loading report...</p>;
  }

  return (
    <div>
  <h1 className="text-3xl font-bold mb-6">Reports</h1>
<div className="flex gap-4 mb-4 items-end print:hidden">
  <div>
    <label className="block text-sm text-gray-700">Start Date</label>
    <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      className="border p-2 rounded w-full"
    />
  </div>
  <div>
    <label className="block text-sm text-gray-700">End Date</label>
    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      className="border p-2 rounded w-full"
    />
  </div>
  <button
    onClick={fetchTransactions}
    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
  >
    Filter
  </button>
</div>

<button
  onClick={() => window.print()}
  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4 print:hidden"
>
  🖨️ Print / Save PDF
</button>

<div id="report-content">
  {transactions.length === 0 ? (
    <p className="text-gray-500">No transactions recorded in this range.</p>
  ) : (
    <table className="min-w-full text-left text-sm mt-4">
      <thead>
        <tr className="bg-gray-200">
          <th className="p-2">Date</th>
          <th className="p-2">Product</th>
          <th className="p-2">Category</th>
          <th className="p-2">Type</th>
          <th className="p-2">Amount</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((txn) => (
          <tr key={txn.id} className="border-t">
            <td className="p-2">{new Date(txn.timestamp).toLocaleString()}</td>
            <td className="p-2">{txn.product_name}</td>
            <td className="p-2">{txn.product_category}</td>
            <td className={`p-2 font-medium ${txn.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
              {txn.type.toUpperCase()}
            </td>
            <td className="p-2">{txn.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>
    </div>
  );
}

export default Reports;