/**
 * PolicyOutcomePanel Component
 * Renders the policy evaluation result inline within the booking flow.
 *
 * AC-POL-01-05: WARN — visible, non-blocking; traveler can continue
 * AC-POL-01-06 / AC-POL-04-03: BLOCK — non-dismissible, only "Return to Search"
 * AC-EXP-02-10: WARN rendered alongside booking details, does not prevent hold
 */

import React, { useState } from 'react';
import type { PolicyEvaluationResponse } from '../../api/types/policy';
import './PolicyOutcomePanel.css';

export interface PolicyOutcomePanelProps {
  policyEvaluation: PolicyEvaluationResponse;
  onReturnToSearch: () => void;
}

export const PolicyOutcomePanel: React.FC<PolicyOutcomePanelProps> = ({
  policyEvaluation,
  onReturnToSearch,
}) => {
  const { outcome, policies, warnings } = policyEvaluation;
  const [warnAcknowledged, setWarnAcknowledged] = useState(false);

  if (outcome === 'ALLOW') {
    return (
      <div className="policy-panel policy-panel-allow" role="status" aria-label="Policy check passed">
        <span className="policy-panel-icon">✓</span>
        <div>
          <strong>Policy Check Passed</strong>
          <p>This booking complies with your organisation's travel policy.</p>
        </div>
      </div>
    );
  }

  if (outcome === 'BLOCK') {
    return (
      <div className="policy-panel policy-panel-block" role="alert" aria-label="Booking blocked by policy" aria-live="assertive">
        <span className="policy-panel-icon">✕</span>
        <div className="policy-panel-body">
          <strong>Booking Blocked by Policy</strong>
          {policies.filter(p => p.isBreached).map((p, i) => (
            <p key={i} className="policy-rule-message">
              <span className="policy-rule-name">{p.policyName}:</span> {p.details}
            </p>
          ))}
          <div className="policy-panel-actions">
            <button
              type="button"
              className="policy-return-btn"
              onClick={onReturnToSearch}
              aria-label="Return to search"
            >
              ← Return to Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (outcome === 'WARN') {
    return (
      <div className={`policy-panel policy-panel-warn ${warnAcknowledged ? 'policy-panel-warn-ack' : ''}`} role="note" aria-label="Policy warning">
        <span className="policy-panel-icon">⚠</span>
        <div className="policy-panel-body">
          <strong>Policy Warning</strong>
          {policies.map((p, i) => (
            <p key={i} className="policy-rule-message">
              <span className="policy-rule-name">{p.policyName}:</span> {p.details}
            </p>
          ))}
          {warnings?.map((w, i) => (
            <p key={`w-${i}`} className="policy-warning-message">{w.message}</p>
          ))}
          {!warnAcknowledged && (
            <div className="policy-panel-actions">
              <button
                type="button"
                className="policy-ack-btn"
                onClick={() => setWarnAcknowledged(true)}
                aria-label="Acknowledge policy warning and continue"
              >
                I understand — continue anyway
              </button>
            </div>
          )}
          {warnAcknowledged && (
            <p className="policy-ack-confirmed" aria-live="polite">
              ✓ Warning acknowledged — you may proceed to hold.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (outcome === 'REQUIRE_APPROVAL') {
    return (
      <div className="policy-panel policy-panel-approval" role="note" aria-label="Approval required">
        <span className="policy-panel-icon">⏳</span>
        <div className="policy-panel-body">
          <strong>Manager Approval Required</strong>
          {policies.map((p, i) => (
            <p key={i} className="policy-rule-message">
              <span className="policy-rule-name">{p.policyName}:</span> {p.details}
            </p>
          ))}
          {policyEvaluation.approvalDetails && (
            <p className="policy-approval-note">
              Approval request will be sent to your manager. The booking will be held
              for {new Date(policyEvaluation.approvalDetails.deadline).toLocaleString()}.
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
};

PolicyOutcomePanel.displayName = 'PolicyOutcomePanel';
