# Relay AI PRD

## 1. Product Summary
Relay AI Customer Triage helps support teams analyze incoming customer messages and decide the right next action quickly.

## 2. Problem Statement
Initial testing showed business-risk gaps:
- Critical incidents were sometimes scored too low.
- Recommended actions were occasionally incorrect for message type.
- Teams lacked controls to filter, export, customize, and monitor triage operations.
- Missing resilience when API key configuration was absent.

These issues reduce trust, increase handling time, and can delay response for high-impact customer problems.

## 3. Goals
1. Improve triage quality and reliability.
2. Improve action guidance relevance.
3. Improve operational usability for support teams.
4. Improve transparency for quality and SLA monitoring.

## 4. Scope Delivered
### A. Triage Quality
- Upgraded urgency scoring logic using stronger incident signals
- Improved recommendation template mappings per category/urgency
- Added deterministic fallback behavior for categorization
- Added confidence and secondary category outputs

### B. Team Operations
- Added advanced filtering in History page
- Added CSV/JSON export for history results
- Added bulk CSV upload for batch analysis
- Added settings for custom response templates

### C. Visibility & Monitoring
- Added dashboard metrics for workload, urgency distribution, confidence, and escalation-oriented insights

### D. Stability
- Added safer initialization behavior when Groq key is missing

## 5. Testing Performed
- Multi-message scenario testing across fixture and realistic support messages
- Batch test run validation (10-message flow)
- Build validation via `npm run build`
- UI verification on key pages and routes

## 6. Key Issues Identified During Testing
1. Urgency false negatives for short critical incidents
2. Incorrect recommendation mapping for feature requests
3. Missing context for mixed-intent messages
4. Lack of export/filtering/customization for operations
5. API-key dependency causing startup fragility

## 7. Changes Made to Address Issues
- Implemented scoring and mapping fixes in utility layer
- Extended Analyze page to support richer result metadata and bulk upload
- Extended History page with filtering and export
- Added Settings page with custom template control
- Enhanced Dashboard with operational metrics

## 8. Expected Business Impact
- Faster triage and improved response quality
- Lower risk of mishandling urgent customer incidents
- Better support manager visibility into workload and quality signals
- Improved operational readiness for real support-team usage

## 9. Known Limitation
Current implementation is client-side/localStorage first. For enterprise scale, a backend data layer and role-based controls should be added.

## 10. Next Phase Recommendations
1. Add backend persistence and multi-user support
2. Add feedback loop for classification correction
3. Add assignment/routing workflows
4. Add deeper trend analytics and reporting
5. Add role-based access and audit logs
