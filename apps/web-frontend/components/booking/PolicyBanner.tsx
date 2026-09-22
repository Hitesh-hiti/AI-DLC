/**
 * Policy Banner Component
 * Displays policy evaluation outcomes and guidance (AC-POL-01-06)
 */

import React from 'react';
import type { DisplayPolicy } from '../../api/types/policy';
import { PolicyOutcomeValues } from '../../api/types/common';

// Type alias
type PolicyOutcome = typeof PolicyOutcomeValues[keyof typeof PolicyOutcomeValues];
import { Alert } from '../common/Alert';
import { StatusBadge } from '../common/StatusBadge';
import './PolicyBanner.css';

export interface PolicyBannerProps {
  policies: DisplayPolicy[];
  onContactApprover?: () => void;
  onModifyBooking?: () => void;
}

export const PolicyBanner: React.FC<PolicyBannerProps> = ({
  policies,
  onContactApprover,
  onModifyBooking,
}) => {
  if (!policies || policies.length === 0) {
    return null;
  }

  const hasBlock = policies.some((p) => p.outcome === PolicyOutcomeValues.BLOCK);
  const hasRequireApproval = policies.some(
    (p) => p.outcome === PolicyOutcomeValues.REQUIRE_APPROVAL
  );
  const hasWarn = policies.some((p) => p.outcome === PolicyOutcomeValues.WARN);

  const overallOutcome = hasBlock
    ? PolicyOutcomeValues.BLOCK
    : hasRequireApproval
      ? PolicyOutcomeValues.REQUIRE_APPROVAL
      : hasWarn
        ? PolicyOutcomeValues.WARN
        : PolicyOutcomeValues.ALLOW;

  const variantMap: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
      BLOCK: 'error',
      REQUIRE_APPROVAL: 'warning',
      WARN: 'warning',
      ALLOW: 'success',
    };

  return (
    <div className="policy-banner">
      <Alert
        variant={variantMap[overallOutcome]}
        title="Policy Evaluation"
        message={
          <div className="policy-banner-content">
            <div className="policy-banner-status">
              <StatusBadge
                status={overallOutcome}
                type="policy"
              />
            </div>
            <div className="policy-banner-details">
              {policies.map((policy, idx) => (
                <div key={idx} className="policy-item">
                  <h4 className="policy-item-title">{policy.name}</h4>
                  <p className="policy-item-description">{policy.description}</p>
                  <p className="policy-item-message">{policy.message}</p>

                  {policy.actionRequired === 'CONTACT_APPROVER' && policy.contactInfo && (
                    <div className="policy-contact-info">
                      <p>
                        <strong>Approver:</strong> {policy.contactInfo.approverName}
                      </p>
                      <p>
                        <strong>Email:</strong>{' '}
                        <a href={`mailto:${policy.contactInfo.approverEmail}`}>
                          {policy.contactInfo.approverEmail}
                        </a>
                      </p>
                      {policy.contactInfo.deadline && (
                        <p>
                          <strong>Deadline:</strong>{' '}
                          {new Date(policy.contactInfo.deadline).toLocaleDateString()}
                        </p>
                      )}
                      {onContactApprover && (
                        <button
                          className="policy-action-btn"
                          onClick={onContactApprover}
                        >
                          Request Approval
                        </button>
                      )}
                    </div>
                  )}

                  {policy.actionRequired === 'MODIFY_BOOKING' && onModifyBooking && (
                    <button
                      className="policy-action-btn"
                      onClick={onModifyBooking}
                    >
                      Modify Booking
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        }
      />
    </div>
  );
};

PolicyBanner.displayName = 'PolicyBanner';
