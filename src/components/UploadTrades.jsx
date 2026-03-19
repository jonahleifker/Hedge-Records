import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, X, ChevronRight, Save, Clipboard } from 'lucide-react';
import { COMMODITIES } from '../utils/constants';
import { parseExcelFile, EXPECTED_FIELDS, validateRow } from '../utils/excelParser';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export function UploadTrades({ addRecords }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');
  
  // Step 1: Upload, Step 2: Mapping, Step 3: Preview & Commit
  const [step, setStep] = useState(1);
  
  // Mapping state: { expectedFieldKey: sourceHeaderName }
  const [mapping, setMapping] = useState({});
  const [globalCommodity, setGlobalCommodity] = useState('Wheat');
  
  // Preview State
  const [previewRows, setPreviewRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [importSuccess, setImportSuccess] = useState(null);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'paste'
  const [pasteText, setPasteText] = useState('');

  const fileInputRef = useRef(null);

  const processFile = async (selectedFile) => {
    setError('');
    setImportSuccess(null);
    if (!selectedFile) return;

    const validExts = ['.xlsx', '.xls'];
    const lowerName = selectedFile.name.toLowerCase();
    if (!validExts.some(ext => lowerName.endsWith(ext))) {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setFile(selectedFile);
    try {
      const data = await parseExcelFile(selectedFile);
      setParsedData(data);
      
      const initialMap = {};
      EXPECTED_FIELDS.forEach(field => {
        const match = data.headers.find(h => 
          h.toLowerCase().trim() === field.key.toLowerCase() || 
          h.toLowerCase().trim() === field.label.toLowerCase()
        );
        if (match) initialMap[field.key] = match;
      });
      setMapping(initialMap);
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };


  const generatePreview = () => {
    // Map the source rows to the expected fields
    const mappedRows = parsedData.rows.map((sourceRow, idx) => {
      const mappedRecord = { id: crypto.randomUUID() };
      
      EXPECTED_FIELDS.forEach(field => {
        const sourceHeader = mapping[field.key];
        let val = sourceHeader ? sourceRow[sourceHeader] : '';
        
        // Ensure trade date is properly formatted as MM/DD/YYYY if it's a date object
        if (field.key === 'tradeDate' && val instanceof Date) {
          try { val = format(val, 'MM/dd/yyyy'); } catch { /* ignore */ }
        }
        
        mappedRecord[field.key] = val !== undefined && val !== null ? String(val).trim() : '';
      });
      
      // Fallback commodity if needed
      if (!mappedRecord.commodity) {
        mappedRecord.commodity = globalCommodity;
      }
      
      const validation = validateRow(mappedRecord);
      
      return {
        _sourceIndex: idx,
        record: mappedRecord,
        isValid: validation.isValid,
        errors: validation.errors
      };
    });

    setPreviewRows(mappedRows);
    
    // Auto-select valid rows
    const validIndices = new Set();
    mappedRows.forEach((row, i) => {
      if (row.isValid) validIndices.add(i);
    });
    setSelectedRows(validIndices);
    
    setStep(3);
  };

  const handleCommit = () => {
    const recordsToCommit = previewRows
      .filter((_, i) => selectedRows.has(i))
      .map(row => row.record);
      
    if (recordsToCommit.length === 0) {
      setError('No valid rows selected to import.');
      return;
    }

    // Group by commodity and add
    const grouped = recordsToCommit.reduce((acc, current) => {
      const comm = current.commodity || globalCommodity;
      if (!acc[comm]) acc[comm] = [];
      acc[comm].push(current);
      return acc;
    }, {});

    Object.keys(grouped).forEach(comm => {
      addRecords(comm, grouped[comm]);
    });

    setImportSuccess(`Successfully imported ${recordsToCommit.length} records.`);
    handleReset();
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setStep(1);
    setMapping({});
    setPreviewRows([]);
    setSelectedRows(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleRowSelection = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upload Trades</h2>
          <p className="text-gray-500 mt-1">Import daily trade records via Excel.</p>
        </div>
        {importSuccess && (
          <div className="flex items-center text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
            <CheckCircle size={18} className="mr-2" />
            {importSuccess}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Progress Tracker */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className={clsx("flex items-center text-sm font-medium", step >= 1 ? "text-blue-700" : "text-gray-400")}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center border-2 mr-2 border-current">1</span>
            Upload File
          </div>
          <ChevronRight className="mx-4 text-gray-300" size={18} />
          <div className={clsx("flex items-center text-sm font-medium", step >= 2 ? "text-blue-700" : "text-gray-400")}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center border-2 mr-2 border-current">2</span>
            Map Columns
          </div>
          <ChevronRight className="mx-4 text-gray-300" size={18} />
          <div className={clsx("flex items-center text-sm font-medium", step >= 3 ? "text-blue-700" : "text-gray-400")}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center border-2 mr-2 border-current">3</span>
            Review & Import
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start border border-red-200">
              <AlertCircle size={20} className="mr-3 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div>
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setUploadMode('file')}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                    uploadMode === 'file' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <UploadCloud size={16} /> Upload File
                </button>
                <button
                  onClick={() => setUploadMode('paste')}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                    uploadMode === 'paste' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <Clipboard size={16} /> Paste from Clipboard
                </button>
              </div>

              {uploadMode === 'file' ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UploadCloud size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Click or drag file to this area to upload</h3>
                  <p className="text-gray-500 text-sm mb-6">Support for a single .xlsx or .xls file.</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleChange}
                    accept=".xlsx, .xls"
                    className="hidden"
                  />
                  <button className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    Browse Files
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Paste tab-separated data from your spreadsheet. First row should be headers.</p>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={`tradeDate\ttradeNumber\ttradeType\tcashPrice\tfuturesPrice\tbasis\tsizeInBushels\n02/28/2026\tCN-2000\tHedge\t440.00\t484.50\t-44.50\t5000`}
                    rows={10}
                    className="w-full border border-gray-300 rounded-xl p-4 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                  />
                  <button
                    onClick={() => {
                      if (!pasteText.trim()) { setError('Please paste some data.'); return; }
                      const lines = pasteText.trim().split('\n');
                      if (lines.length < 2) { setError('Need at least a header row and one data row.'); return; }
                      const headers = lines[0].split('\t').map(h => h.trim());
                      const rows = lines.slice(1).map(line => {
                        const vals = line.split('\t');
                        const obj = {};
                        headers.forEach((h, i) => { obj[h] = vals[i]?.trim() || ''; });
                        return obj;
                      });
                      setParsedData({ headers, rows });
                      const initialMap = {};
                      EXPECTED_FIELDS.forEach(field => {
                        const match = headers.find(h =>
                          h.toLowerCase().trim() === field.key.toLowerCase() ||
                          h.toLowerCase().trim() === field.label.toLowerCase()
                        );
                        if (match) initialMap[field.key] = match;
                      });
                      setMapping(initialMap);
                      setStep(2);
                    }}
                    className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Parse Pasted Data
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: MAPPING */}
          {step === 2 && parsedData && (
            <div>
              <div className="mb-6 bg-gray-50 p-4 rounded-lg flex items-center justify-between border border-gray-200">
                <div className="flex items-center">
                  <FileSpreadsheet className="text-emerald-600 mr-3" size={24} />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{parsedData.rows.length} rows detected</p>
                  </div>
                </div>
                <button onClick={handleReset} className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
                  <X size={16} className="mr-1" /> Cancel
                </button>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Default Commodity</h3>
                <p className="text-sm text-gray-600 mb-3">If the uploaded file does not specify a commodity for a row, which record set should it be applied to?</p>
                <div className="flex space-x-4">
                  {COMMODITIES.map(c => (
                    <label key={c} className={clsx("flex items-center p-3 border rounded-lg cursor-pointer transition-colors", globalCommodity === c ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50")}>
                      <input type="radio" name="globalComm" className="mr-3" checked={globalCommodity === c} onChange={() => setGlobalCommodity(c)} />
                      <span className="font-medium text-gray-800">{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-4">Column Mapping</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {EXPECTED_FIELDS.map(field => (
                  <div key={field.key} className="flex flex-col mb-2">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      {field.label} {field.key !== 'commodity' && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={mapping[field.key] || ''}
                      onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                    >
                      <option value="">-- Ignored / Not in file --</option>
                      {parsedData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-4">
                <button onClick={handleReset} className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 font-medium rounded-lg hover:bg-gray-50">
                  Back
                </button>
                <button onClick={generatePreview} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
                  Continue to Preview
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & COMMIT */}
          {step === 3 && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Preview Data</h3>
                  <p className="text-sm text-gray-500">
                    Review the {previewRows.length} parsed rows. Valid rows are selected by default.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button onClick={() => setStep(2)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50">
                    Edit Mapping
                  </button>
                  <button onClick={handleCommit} disabled={selectedRows.size === 0} className="px-4 py-2 bg-[#00c48c] text-[#0f1f3d] text-sm font-semibold rounded-lg hover:bg-[#00a877] disabled:opacity-50 flex items-center">
                    <Save size={16} className="mr-2" />
                    Import {selectedRows.size} Records
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-gray-600 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="p-4 w-10">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedRows.size === previewRows.filter(r => r.isValid).length && previewRows.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const v = new Set();
                              previewRows.forEach((r, i) => r.isValid && v.add(i));
                              setSelectedRows(v);
                            } else {
                              setSelectedRows(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="px-4 py-3">Status</th>
                      {EXPECTED_FIELDS.map(f => (
                        <th key={f.key} className="px-4 py-3">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className={clsx("border-b", !row.isValid ? "bg-red-50/50" : "hover:bg-gray-50")}>
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(i)}
                            onChange={() => toggleRowSelection(i)}
                            disabled={!row.isValid}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full"><CheckCircle size={12} className="mr-1"/> Valid</span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full"><AlertCircle size={12} className="mr-1"/> Errors</span>
                          )}
                        </td>
                        {EXPECTED_FIELDS.map(f => (
                          <td key={f.key} className="px-4 py-3">
                            <span className={clsx(!row.isValid && row.errors[f.key] && "text-red-600 font-medium")}>
                              {row.record[f.key] || <span className="text-gray-400 italic">Empty</span>}
                            </span>
                            {!row.isValid && row.errors[f.key] && (
                             <div className="text-[10px] text-red-600 mt-0.5">{row.errors[f.key]}</div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewRows.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No data could be parsed.</div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
