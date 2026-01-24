'use client';

import { useState, useEffect } from 'react';

interface InjuryAnalysis {
  injuryAdjustment: number;
  campAdjustment: number;
  totalAdjustment: number;
  concerns: string[];
  positives: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

interface IntelligenceData {
  fighter: {
    id: string;
    name: string;
  };
  injuries: Array<{
    id: string;
    bodyPart: string;
    severity: string;
    description?: string;
    isRecovered: boolean;
    affectsFight: boolean;
    reportedDate: string;
  }>;
  campIntel: Array<{
    id: string;
    campWeeks?: number;
    isShortNotice: boolean;
    campChanged: boolean;
    weightIssues: boolean;
    personalIssues: boolean;
    lowConfidence: boolean;
    highConfidence: boolean;
    sparringQuality?: string;
    specificPrep: boolean;
    reportedDate: string;
  }>;
  analysis: InjuryAnalysis;
}

interface Props {
  fighterId: string;
  fighterName: string;
  compact?: boolean;
}

export default function IntelligencePanel({ fighterId, fighterName, compact = false }: Props) {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState<'injury' | 'camp' | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/intelligence?fighterId=${fighterId}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch intelligence:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [fighterId]);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-800 rounded-lg p-4">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { analysis } = data;

  // Compact view for fight cards
  if (compact) {
    if (analysis.concerns.length === 0 && analysis.positives.length === 0) {
      return null; // Don't show if nothing to report
    }

    return (
      <div className={`rounded-lg p-2 text-xs ${getRiskBgColor(analysis.riskLevel)}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-medium ${getRiskTextColor(analysis.riskLevel)}`}>
            {getRiskIcon(analysis.riskLevel)} {analysis.riskLevel.toUpperCase()} RISK
          </span>
        </div>
        <div className="space-y-0.5 text-gray-300">
          {analysis.concerns.slice(0, 2).map((c, i) => (
            <div key={i} className="truncate">- {c}</div>
          ))}
          {analysis.positives.slice(0, 1).map((p, i) => (
            <div key={i} className="text-green-400 truncate">+ {p}</div>
          ))}
        </div>
      </div>
    );
  }

  // Full panel view
  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">Intelligence Report: {fighterName}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(showAddForm === 'injury' ? null : 'injury')}
            className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
          >
            + Injury
          </button>
          <button
            onClick={() => setShowAddForm(showAddForm === 'camp' ? null : 'camp')}
            className="text-xs px-2 py-1 rounded bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 transition-colors"
          >
            + Camp Intel
          </button>
        </div>
      </div>

      {/* Add Forms */}
      {showAddForm && (
        <AddIntelForm
          type={showAddForm}
          fighterId={fighterId}
          onClose={() => setShowAddForm(null)}
          onSuccess={() => {
            setShowAddForm(null);
            // Refresh data
            fetch(`/api/intelligence?fighterId=${fighterId}`)
              .then(r => r.json())
              .then(setData);
          }}
        />
      )}

      {/* Risk Summary */}
      <div className={`rounded-lg p-3 mb-4 ${getRiskBgColor(analysis.riskLevel)}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getRiskIcon(analysis.riskLevel)}</span>
          <div>
            <div className={`font-bold ${getRiskTextColor(analysis.riskLevel)}`}>
              {analysis.riskLevel.toUpperCase()} RISK PROFILE
            </div>
            <div className="text-sm text-gray-400">
              Total Impact: {(analysis.totalAdjustment * 100).toFixed(1)}% adjustment
            </div>
          </div>
        </div>
      </div>

      {/* Concerns */}
      {analysis.concerns.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-red-400 mb-2">Concerns</h4>
          <ul className="space-y-1">
            {analysis.concerns.map((concern, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-red-500">-</span>
                {concern}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Positives */}
      {analysis.positives.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-green-400 mb-2">Positives</h4>
          <ul className="space-y-1">
            {analysis.positives.map((positive, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-green-500">+</span>
                {positive}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Injuries List */}
      {data.injuries.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Injury History</h4>
          <div className="space-y-2">
            {data.injuries.map(injury => (
              <div
                key={injury.id}
                className={`text-sm p-2 rounded ${
                  injury.isRecovered
                    ? 'bg-gray-800/50 text-gray-500'
                    : 'bg-red-900/20 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${getSeverityColor(injury.severity)}`}>
                    {injury.severity}
                  </span>
                  <span className="font-medium">{injury.bodyPart}</span>
                  {injury.isRecovered && (
                    <span className="text-green-500 text-xs">(Recovered)</span>
                  )}
                </div>
                {injury.description && (
                  <p className="text-xs text-gray-500 mt-1">{injury.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Camp Intel List */}
      {data.campIntel.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Recent Camp Reports</h4>
          <div className="space-y-2">
            {data.campIntel.slice(0, 3).map(camp => (
              <div key={camp.id} className="text-sm p-2 rounded bg-gray-800/50">
                <div className="flex flex-wrap gap-1 mb-1">
                  {camp.isShortNotice && (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-red-900/50 text-red-400">Short Notice</span>
                  )}
                  {camp.campChanged && (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-900/50 text-yellow-400">Camp Change</span>
                  )}
                  {camp.weightIssues && (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-orange-900/50 text-orange-400">Weight Issues</span>
                  )}
                  {camp.highConfidence && (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-green-900/50 text-green-400">High Confidence</span>
                  )}
                  {camp.specificPrep && (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-blue-900/50 text-blue-400">Specific Prep</span>
                  )}
                </div>
                {camp.campWeeks && (
                  <p className="text-xs text-gray-500">{camp.campWeeks} week camp</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {data.injuries.length === 0 && data.campIntel.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>No intelligence data available</p>
          <p className="text-xs mt-1">Add injury or camp reports to track this fighter</p>
        </div>
      )}
    </div>
  );
}

function AddIntelForm({
  type,
  fighterId,
  onClose,
  onSuccess,
}: {
  type: 'injury' | 'camp';
  fighterId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};

    formData.forEach((value, key) => {
      if (value === 'on') {
        data[key] = true;
      } else if (value) {
        data[key] = value;
      }
    });

    try {
      const response = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, fighterId, data }),
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setSubmitting(false);
    }
  }

  if (type === 'injury') {
    return (
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-4 mb-4 space-y-3">
        <h4 className="text-sm font-semibold text-white">Add Injury Report</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Body Part</label>
            <select name="bodyPart" required className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1">
              <option value="knee">Knee</option>
              <option value="shoulder">Shoulder</option>
              <option value="hand">Hand</option>
              <option value="back">Back</option>
              <option value="leg">Leg</option>
              <option value="head">Head</option>
              <option value="neck">Neck</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Severity</label>
            <select name="severity" required className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1">
              <option value="minor">Minor</option>
              <option value="moderate">Moderate</option>
              <option value="major">Major</option>
              <option value="career_threatening">Career Threatening</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Description (optional)</label>
          <input
            type="text"
            name="description"
            placeholder="ACL tear, broken hand, etc."
            className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Source (optional)</label>
          <input
            type="text"
            name="source"
            placeholder="MMA Fighting, ESPN, etc."
            className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-sm text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Injury'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-4 mb-4 space-y-3">
      <h4 className="text-sm font-semibold text-white">Add Camp Intelligence</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Camp Duration (weeks)</label>
          <input
            type="number"
            name="campWeeks"
            min="1"
            max="20"
            className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Sparring Quality</label>
          <select name="sparringQuality" className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1">
            <option value="">Unknown</option>
            <option value="elite">Elite</option>
            <option value="good">Good</option>
            <option value="average">Average</option>
            <option value="poor">Poor</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input type="checkbox" name="isShortNotice" className="rounded" />
          Short Notice
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input type="checkbox" name="campChanged" className="rounded" />
          Camp Changed
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input type="checkbox" name="weightIssues" className="rounded" />
          Weight Issues
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input type="checkbox" name="personalIssues" className="rounded" />
          Personal Issues
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input type="checkbox" name="highConfidence" className="rounded" />
          High Confidence
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input type="checkbox" name="specificPrep" className="rounded" />
          Specific Prep
        </label>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Source (optional)</label>
        <input
          type="text"
          name="source"
          placeholder="Interview, social media, etc."
          className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 text-sm text-gray-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Adding...' : 'Add Camp Intel'}
        </button>
      </div>
    </form>
  );
}

function getRiskIcon(riskLevel: string): string {
  switch (riskLevel) {
    case 'low': return '✅';
    case 'medium': return '⚠️';
    case 'high': return '🔶';
    case 'extreme': return '🚨';
    default: return '❓';
  }
}

function getRiskBgColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low': return 'bg-green-900/20 border border-green-800';
    case 'medium': return 'bg-yellow-900/20 border border-yellow-800';
    case 'high': return 'bg-orange-900/20 border border-orange-800';
    case 'extreme': return 'bg-red-900/20 border border-red-800';
    default: return 'bg-gray-800';
  }
}

function getRiskTextColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low': return 'text-green-400';
    case 'medium': return 'text-yellow-400';
    case 'high': return 'text-orange-400';
    case 'extreme': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'minor': return 'bg-yellow-900/50 text-yellow-400';
    case 'moderate': return 'bg-orange-900/50 text-orange-400';
    case 'major': return 'bg-red-900/50 text-red-400';
    case 'career_threatening': return 'bg-red-900/70 text-red-300';
    default: return 'bg-gray-700 text-gray-400';
  }
}
