import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, AlertCircle, Loader2, RefreshCw,
  BrainCircuit, Info, BarChart3,
} from 'lucide-react';
import { insightsApi } from '../../api/insightsApi';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

/* ── Shared card ── */
function Card({ className = '', style = {}, children }) {
  return (
    <div className={`rounded-xl ${className}`}
      style={{ background: '#ffffff', border: '1px solid #E5EAE8', ...style }}>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════
   SVG Forecast Chart
   Historical = solid green line
   Forecast = dashed amber line + CI band
════════════════════════════════════════════════ */
function ForecastChart({ historical, forecast }) {
  const all = [...historical, ...forecast];
  const W = 720;
  const H = 200;
  const PAD = { t: 20, b: 32, l: 12, r: 12 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  const maxVal = Math.max(
    ...historical.map((h) => h.predicted_emissions),
    ...forecast.map((f) => f.upper_bound),
    0.001,
  );

  const toXY = (idx0based, val) => ({
    x: PAD.l + (idx0based / (all.length - 1)) * iW,
    y: PAD.t + iH - (val / maxVal) * iH,
  });

  // Historical points
  const hPts = historical.map((h, i) => ({
    ...toXY(i, h.predicted_emissions),
    label: h.label || `M${i + 1}`,
    v: h.predicted_emissions
  }));

  // Forecast points
  const fPts = forecast.map((f, i) => ({
    ...toXY(historical.length + i, f.predicted_emissions),
    upper: toXY(historical.length + i, f.upper_bound).y,
    lower: toXY(historical.length + i, f.lower_bound).y,
    label: f.month || `F${i + 1}`,
    v: f.predicted_emissions,
    lo: f.lower_bound,
    hi: f.upper_bound,
  }));

  const hPath = hPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const fPath = hPts.length
    ? `M${hPts[hPts.length - 1].x.toFixed(1)},${hPts[hPts.length - 1].y.toFixed(1)} ` +
    fPts.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    : '';

  const bandPath = fPts.length >= 1
    ? fPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.upper.toFixed(1)}`).join(' ')
    + ' ' + fPts.slice().reverse().map((p) => `L${p.x.toFixed(1)},${p.lower.toFixed(1)}`).join(' ') + ' Z'
    : '';

  const divX = hPts.length ? hPts[hPts.length - 1].x : 0;
  const totalPts = all.length;
  const step = Math.max(1, Math.ceil(totalPts / 9));

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
        style={{ minWidth: '360px' }}>

        {/* Horizontal grid */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f}
            x1={PAD.l} y1={PAD.t + iH * (1 - f)}
            x2={W - PAD.r} y2={PAD.t + iH * (1 - f)}
            stroke="#F0EDE4" strokeWidth="1" />
        ))}

        {/* Confidence band */}
        {bandPath && <path d={bandPath} fill="#C4952A" opacity="0.12" />}

        {/* Historical area fill */}
        {hPath && (
          <>
            <defs>
              <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <path d={`${hPath} L${hPts[hPts.length - 1].x.toFixed(1)},${(PAD.t + iH).toFixed(1)} L${hPts[0].x.toFixed(1)},${(PAD.t + iH).toFixed(1)} Z`}
              fill="url(#hGrad)" />
          </>
        )}

        {/* Historical line */}
        {hPath && (
          <path d={hPath} fill="none" stroke="#2D6A4F" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Forecast line — dashed amber */}
        {fPath && (
          <path d={fPath} fill="none" stroke="#C4952A" strokeWidth="2.5"
            strokeDasharray="7,4" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Divider */}
        {hPts.length > 0 && (
          <line x1={divX.toFixed(1)} y1={PAD.t}
            x2={divX.toFixed(1)} y2={(PAD.t + iH).toFixed(1)}
            stroke="#9BAEA5" strokeWidth="1.5" strokeDasharray="5,4" />
        )}

        {/* Historical dots */}
        {hPts.map((p, i) => (
          <circle key={`h${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4"
            fill="#2D6A4F" stroke="#ffffff" strokeWidth="1.5" />
        ))}

        {/* Forecast dots */}
        {fPts.map((p, i) => (
          <circle key={`f${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4"
            fill="#C4952A" stroke="#ffffff" strokeWidth="1.5" />
        ))}

        {/* X-axis labels */}
        {all.map((pt, i) => {
          if (i % step !== 0 && i !== all.length - 1) return null;
          const px = i < historical.length
            ? hPts[i].x
            : fPts[i - historical.length].x;
          const isFc = i >= historical.length;
          return (
            <text key={i} x={px.toFixed(1)} y={H - 6}
              textAnchor="middle" fontSize="9.5" fill={isFc ? '#C4952A' : '#9BAEA5'}
              fontFamily="'JetBrains Mono', monospace" fontWeight={isFc ? '600' : '400'}>
              {pt.month || pt.label || `M${i + 1}`}
            </text>
          );
        })}

        {/* Legend */}
        <text x={PAD.l} y={PAD.t - 6} fontSize="9" fill="#2D6A4F" fontFamily="sans-serif" fontWeight="600">Historical</text>
        {fPts.length > 0 && (
          <text x={fPts[0].x.toFixed(1)} y={PAD.t - 6} fontSize="9" fill="#C4952A"
            fontFamily="sans-serif" fontWeight="600">Predicted →</text>
        )}
      </svg>
    </div>
  );
}

/* ── Model badge ── */
function ModelBadge({ modelName, rmse, r2 }) {
  const getColor = (rmse) => {
    if (rmse < 100) return '#2D6A4F';
    if (rmse < 200) return '#52B788';
    if (rmse < 500) return '#C4952A';
    return '#DC2626';
  };

  const color = getColor(rmse);
  const bg = color === '#2D6A4F' ? '#EAF4EE' : color === '#52B788' ? '#EAF4EE' : '#FDF5E6';

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{ background: bg, border: `1px solid ${color}33` }}>
      <span className="font-bold text-sm" style={{ color }}>
        {modelName}
      </span>
      <span className="text-xs" style={{ color: '#9BAEA5' }}>
        RMSE: {rmse.toFixed(1)}
      </span>
    </div>
  );
}

/* ── Empty state ── */
function NotEnoughData({ error, navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-8">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: '#EAF4EE' }}>
        <BrainCircuit className="h-7 w-7" style={{ color: '#2D6A4F' }} />
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: '#1A2118' }}>
        Not enough data to predict
      </h3>
      <p className="text-sm max-w-sm mb-4" style={{ color: '#9BAEA5' }}>
        {error || 'Log carbon entries across at least 2 months to generate ML-powered predictions using Prophet, XGBoost, and Holt-Winters.'}
      </p>
      <button onClick={() => navigate('/dashboard/activities')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ background: '#2D6A4F' }}>
        Log Entries
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════
   Main Page
════════════════════════════════════════════════ */
export default function ForecastPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const [months, setMonths] = useState(12);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mlHealth, setMlHealth] = useState('unknown');

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Check ML service health
      try {
        const health = await insightsApi.checkMLServiceHealth();
        setMlHealth(health.status === 'up' ? 'up' : 'down');
      } catch (e) {
        setMlHealth('down');
      }

      // Get forecast
      const { data: res } = await insightsApi.getForecast(months);
      setForecast(res);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to generate forecast. Ensure you have logged carbon entries for at least 2 months.');
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => { fetchForecast(); }, [fetchForecast]);

  const bestModel = forecast?.forecast?.best_model;
  const models = forecast?.forecast?.models || {};

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1A2118' }}>
            <BrainCircuit className="h-5 w-5" style={{ color: '#2D6A4F' }} />
            Emission Forecast
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#9BAEA5' }}>
            AI-powered predictions using Prophet, XGBoost, and Holt-Winters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchForecast} disabled={loading}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-40"
            style={{ color: '#7A9E8E', border: '1px solid #E5EAE8' }}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex gap-1 p-1 rounded-lg"
            style={{ background: '#F4F6F4', border: '1px solid #E5EAE8' }}>
            {[6, 12, 24].map((n) => (
              <button key={n} onClick={() => setMonths(n)}
                className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all whitespace-nowrap"
                style={n === months
                  ? { background: '#2D6A4F', color: '#fff' }
                  : { color: '#7A9E8E' }}>
                +{n}mo
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info banner */}
      <Card className="p-4 flex items-start gap-3"
        style={{ background: '#F8FAF8', border: '1px solid #E5EAE8' }}>
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#2D6A4F' }} />
        <div className="text-xs leading-relaxed" style={{ color: '#5A7A6D' }}>
          <strong style={{ color: '#1A2118' }}>How it works:</strong>{' '}
          Three ML models compete: <strong>Prophet</strong> detects trend & seasonality,
          <strong> XGBoost</strong> uses engineered features, <strong>Holt-Winters</strong> is fast & interpretable.
          The <strong>best model</strong> is selected based on lowest RMSE. Shaded band shows 90% prediction interval.
          More historical data = higher accuracy.
        </div>
      </Card>

      {/* ML Service status */}
      {mlHealth === 'down' && (
        <Card className="p-4 flex items-center gap-3" style={{ border: '1px solid #FCA5A5', background: '#FEF2F2' }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#DC2626' }} />
          <p className="text-sm" style={{ color: '#991B1B' }}>
            ML Service is currently unavailable. Please check that the Python microservice (port 5001) is running.
          </p>
        </Card>
      )}

      {error && (
        <Card className="p-4 flex items-center gap-3" style={{ border: '1px solid #FECACA' }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#DC2626' }} />
          <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9BAEA5' }} />
        </div>
      )}

      {!loading && !error && forecast && (
        <>
          {!forecast?.forecast || !models?.prophet ? (
            <Card><NotEnoughData error={forecast?.error} navigate={navigate} /></Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5">

              {/* Model comparison row */}
              <div className="flex flex-wrap items-center gap-2">
                {models?.prophet && (
                  <ModelBadge
                    modelName={`Prophet ${bestModel === 'prophet' ? '⭐' : ''}`}
                    rmse={models.prophet.metrics?.rmse || 0}
                    r2={models.prophet.metrics?.r2 || 0}
                  />
                )}
                {models?.xgboost && (
                  <ModelBadge
                    modelName={`XGBoost ${bestModel === 'xgboost' ? '⭐' : ''}`}
                    rmse={models.xgboost.metrics?.rmse || 0}
                    r2={models.xgboost.metrics?.r2 || 0}
                  />
                )}
                {models?.holt_winters && (
                  <ModelBadge
                    modelName={`HW ${bestModel === 'holt_winters' ? '⭐' : ''}`}
                    rmse={models.holt_winters.metrics?.rmse || 0}
                    r2={models.holt_winters.metrics?.r2 || 0}
                  />
                )}
              </div>

              {/* Main forecast chart using best model */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: '#1A2118' }}>
                      {bestModel?.toUpperCase()} Forecast
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: '#9BAEA5' }}>kg CO₂e per month (90% confidence interval)</p>
                  </div>
                  <div className="flex items-center gap-5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 rounded" style={{ background: '#2D6A4F' }} />
                      <span style={{ color: '#9BAEA5' }}>Historical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5" style={{ background: '#C4952A', borderTop: '2px dashed #C4952A', borderBottom: 'none' }} />
                      <span style={{ color: '#9BAEA5' }}>Forecast</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-3 rounded-sm" style={{ background: 'rgba(196,149,42,0.18)' }} />
                      <span style={{ color: '#9BAEA5' }}>90% CI</span>
                    </div>
                  </div>
                </div>

                {bestModel && models[bestModel]?.forecast && (
                  <ForecastChart
                    historical={forecast?.forecast?.models?.[bestModel]?.forecast?.slice(0, -12) || []}
                    forecast={models[bestModel].forecast}
                  />
                )}
              </Card>

              {/* Month-by-month cards */}
              <div>
                <h2 className="text-sm font-semibold mb-3" style={{ color: '#1A2118' }}>
                  12-Month Predictions ({bestModel?.toUpperCase()})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {models[bestModel]?.forecast?.slice(0, 12).map((f, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}>
                      <Card className="p-4 text-center">
                        <p className="text-xs font-bold uppercase tracking-wider mb-2"
                          style={{ color: '#C4952A', fontFamily: "'JetBrains Mono', monospace" }}>
                          {f.month}
                        </p>
                        <p className="text-2xl font-bold mb-0.5" style={{ color: '#1A2118' }}>
                          {Math.round(f.predicted_emissions)}
                        </p>
                        <p className="text-[10px] mb-3" style={{ color: '#9BAEA5' }}>kg CO₂e</p>
                        <div className="text-[10px] pt-2.5" style={{ borderTop: '1px solid #F0EDE4', color: '#9BAEA5' }}>
                          <div className="flex justify-between text-xs">
                            <span>{Math.round(f.lower_bound)}</span>
                            <span>{Math.round(f.upper_bound)}</span>
                          </div>
                          <p style={{ color: '#7A9E8E', fontSize: '0.65rem' }}>90% range</p>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Model metrics comparison */}
              {isAdmin && (
                <Card className="p-6">
                  <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: '#1A2118' }}>
                    <BarChart3 className="h-4 w-4" /> Model Performance Comparison
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E5EAE8' }}>
                          <th style={{ textAlign: 'left', padding: '0.5rem', color: '#9BAEA5', fontWeight: '600' }}>Model</th>
                          <th style={{ textAlign: 'right', padding: '0.5rem', color: '#9BAEA5', fontWeight: '600' }}>RMSE</th>
                          <th style={{ textAlign: 'right', padding: '0.5rem', color: '#9BAEA5', fontWeight: '600' }}>MAE</th>
                          <th style={{ textAlign: 'right', padding: '0.5rem', color: '#9BAEA5', fontWeight: '600' }}>R²</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(models).map(([name, model]) => (
                          <tr key={name} style={{ borderBottom: '1px solid #F0EDE4' }}>
                            <td style={{ padding: '0.5rem', color: '#1A2118', fontWeight: '600' }}>
                              {name === 'prophet' && 'Prophet'}
                              {name === 'xgboost' && 'XGBoost'}
                              {name === 'holt_winters' && 'Holt-Winters'}
                              {bestModel === name && ' ⭐'}
                            </td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#9BAEA5' }}>
                              {model.metrics?.rmse?.toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#9BAEA5' }}>
                              {model.metrics?.mae?.toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#9BAEA5' }}>
                              {(model.metrics?.r2 * 100)?.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Help card */}
              <Card className="p-5" style={{ background: '#FDF5E6', border: '1px solid #F5E3C0' }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"
                  style={{ color: '#7C5A10' }}>
                  <Info className="h-4 w-4" /> How to improve accuracy
                </h3>
                <ul className="text-xs leading-relaxed list-disc list-inside" style={{ color: '#9C7020' }}>
                  <li>Log emissions consistently (daily or weekly)</li>
                  <li>Build at least 12 months of historical data</li>
                  <li>Include all emission sources (scope 1, 2, 3)</li>
                  <li>Regular logging reduces prediction uncertainty</li>
                </ul>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
