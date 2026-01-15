export const Inventory = () => {
  const productosDemo = [
    {
      id: 1,
      sku: "EQU-001",
      nombre: "Sillón Dental Premium X1",
      categoria: "Mobiliario",
      stock: 5,
      precio: 4500,
    },
    {
      id: 2,
      sku: "RAY-005",
      nombre: "Rayos X Panorámico",
      categoria: "Radiología",
      stock: 1,
      precio: 12800,
    },
    {
      id: 3,
      sku: "INS-022",
      nombre: "Kit Turbina LED",
      categoria: "Instrumental",
      stock: 15,
      precio: 850,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">Total Productos</p>
          <p className="text-3xl font-bold text-slate-800">
            {productosDemo.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">Valor Inventario</p>
          <p className="text-3xl font-bold text-slate-800">$18,150</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-5 text-slate-600 font-semibold uppercase text-xs">
                SKU
              </th>
              <th className="p-5 text-slate-600 font-semibold uppercase text-xs">
                Producto
              </th>
              <th className="p-5 text-slate-600 font-semibold uppercase text-xs">
                Stock
              </th>
              <th className="p-5 text-slate-600 font-semibold uppercase text-xs">
                Precio Venta
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {productosDemo.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-5 font-mono text-sm text-blue-600">{p.sku}</td>
                <td className="p-5">
                  <p className="font-bold text-slate-800">{p.nombre}</p>
                  <p className="text-xs text-slate-400">{p.categoria}</p>
                </td>
                <td className="p-5">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      p.stock > 2
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {p.stock} unidades
                  </span>
                </td>
                <td className="p-5 font-bold text-slate-800">
                  ${p.precio.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
