# Marginal

**Project margin control for construction companies — from first customer request to final invoice.**

Construction companies lose thousands of kronor every year to undocumented extra work, poor visibility into project profitability, and fragmented communication between the office and the job site. Marginal tracks every project end-to-end while automatically surfacing potential **ÄTA** (ändrings-, tilläggs- och avgående arbeten), monitoring profitability in real time, and keeping every task, photo, material, and work report connected to the project.

The result: **fewer disputes, better documentation, and tighter control over margins — before problems become expensive.**

---

## The Problem

- **Undocumented extra work.** Under AB 04 / ABT 06, contractors can lose the right to payment for ÄTA work if it isn't notified correctly and on time. Missed notifications are a top cause of margin loss and disputes.
- **No real-time profitability.** Most firms only learn a project lost money *after* the final invoice — too late to act.
- **Fragmented communication.** Photos, time logs, materials, and reports live in scattered tools (or in someone's phone), so documentation falls apart exactly when it's needed.

## The Solution

Marginal connects the office and the job site around a single project record:

- **Automatic ÄTA detection** — flags work logged outside the original scope and turns it into a documented, deadline-safe notification with one tap.
- **Real-time margin monitoring** — continuously compares budgeted vs. actual labor and materials, plus approved ÄTA, and alerts before a project goes underwater.
- **Connected documentation** — every check-in, photo, material, and work report is tied to the project automatically, ready for invoicing or dispute resolution.

---

## Example User Flow

### 1. Customer Request
- A customer submits a renovation request through the company website or directly through the platform.
- The request is stored as a **potential project**.

### 2. Project Planning
- The company reviews the request.
- Estimated labor, materials, budget, and timeline are entered.
- Employees are assigned to the project.

### 3. Project Execution
- Workers use the **mobile app** to:
  - Check in to the site
  - Upload photos
  - Log work completed
  - Record materials used
- **AI summarizes daily work reports automatically.**

### 4. ÄTA Detection
- A worker reports work that wasn't part of the original scope.
- The system **flags it as a potential ÄTA**.
- The project manager reviews and approves it.
- The customer receives a request for approval with documentation and estimated cost.

### 5. Profitability Monitoring
- The platform continuously compares:
  - Budgeted labor vs. actual labor
  - Budgeted materials vs. actual materials
  - Approved ÄTA work
- **Alerts** are generated when profit margins begin shrinking or projects risk becoming unprofitable.

### 6. Project Completion
- All documentation, photos, reports, and approved ÄTA work are compiled automatically.
- The company can generate the **final invoice and project summary** with complete documentation.

---

## Core Concepts

| Concept | Description |
| --- | --- |
| **Project** | The central record. Everything — tasks, photos, materials, time, ÄTA, costs — is connected to a project. |
| **Scope** | The budget baseline expressed as **structured line items** (labor + materials, each with quantity and unit cost) — not free text. This is what ÄTA is measured against and what makes margin math exact. |
| **ÄTA** | Additional and changed work (ändrings-, tilläggs- och avgående arbeten). Detected, documented, approved, and billed without slipping through the cracks. |
| **Margin** | Live comparison of budget vs. actual across labor and materials, including approved ÄTA. |
| **Work Report** | Daily site log (check-ins, photos, materials, completed work), summarized automatically. |

---

## Design Principle

**Scope is structured data, not prose.** A project's budget is a set of typed line items — labor and materials, each with a quantity and unit cost. This single decision is what makes the product work:

- **ÄTA detection becomes deterministic** — "this logged work has no matching scope line" instead of "an AI guessed."
- **Margin math becomes exact** — budgeted is the sum of scope lines; actual is the sum of logged reality.

AI assists on top of this structure (suggesting which scope line work relates to, drafting descriptions, summarizing reports) but is never the source of truth for anything billable or legal.

---

## Data Model

```text
Company (tenant)
  └─ Users (role: owner | manager | worker)
  └─ Customers
  └─ ProjectRequests (leads)        ← step 1: website/platform intake
  └─ Projects                       ← the central record
        ├─ ScopeItems               ← the budget baseline (labor | material)
        ├─ Assignments (User↔Project, + hourly rate)
        ├─ CheckIns                 ← actual labor (time)
        ├─ MaterialUsages           ← actual materials
        ├─ Photos
        ├─ WorkReports (daily)      ← groups check-ins/photos/materials + AI summary
        ├─ AtaItems (change orders) ← detected/created from out-of-scope reality
        ├─ MarginSnapshots          ← computed budget-vs-actual over time
        └─ Invoice / Summary
```

Key entities:

- **Project** — `status: request → planning → active → completed → invoiced`, with cached rollups (`budgetedTotal`, `actualTotal`, `currentMarginPct`).
- **ScopeItem** — `type: labor | material`, `quantity`, `unit`, `unitCost`, `lineTotal`, `isAta`. When an ÄTA is approved it becomes a scope line (`isAta = true`) so detection and margin stay unified.
- **CheckIn** — actual labor (`startedAt`, `endedAt`, `geolocation`, optional `scopeItemRef`); cost = hours × assignment rate.
- **MaterialUsage** — actual materials (`quantity`, `unitCost`, optional `scopeItemRef`, optional source photo).
- **AtaItem** — `status: detected → pending_review → approved_internal → sent_to_customer → customer_approved | rejected`, `triggerType`, `sourceRefs[]` (the evidence), `notifyDeadline` (AB 04 / ABT 06 timing), `estimatedCost`.
- **WorkReport** — daily log with an `aiSummary` for convenience; the linked raw records remain the evidence.

---

## How It Works

### ÄTA detection (deterministic first, AI-assisted second)
1. A worker logs work or material with no matching `scopeItemRef`, **or** a logged quantity exceeds the matching scope line's budgeted quantity → the system auto-creates an `AtaItem` (`status = detected`).
2. AI suggests the related scope line and drafts a description — a human approves before it becomes billable.

### Margin (recomputed on each log event)
```
budgetedLabor = Σ ScopeItem(type=labor,    isAta=false).lineTotal
actualLabor   = Σ CheckIn.hours × rate
budgetedMtl   = Σ ScopeItem(type=material, isAta=false).lineTotal
actualMtl     = Σ MaterialUsage.qty × unitCost
approvedAta   = Σ ScopeItem(isAta=true).lineTotal   (customer_approved only)

margin = (contractValue + approvedAta) − (actualLabor + actualMtl)
```
An alert fires when projected margin drops below a configurable threshold.

---

## Surfaces

- **Manager web app** — planning, scope entry, ÄTA review/approval, margin dashboards, invoicing.
- **Worker mobile app** — check-in, photos, work/material logging; **offline-first** for job sites.
- **Customer approval link** — lightweight, account-free approval of ÄTA with documentation and cost.

---

## Key Decisions

1. **Multi-tenant SaaS** — `Company` is the tenant root.
2. **Approved ÄTA becomes a ScopeItem** (`isAta = true`) rather than a parallel system — unifies detection and margin logic.
3. **Three surfaces** — manager web, offline-first worker mobile, account-free customer approval link.
4. **Swedish-first domain language** (ÄTA, AB 04 / ABT 06) with English code identifiers.

---

## Status

Early stage — defining the plan. This README captures the product vision, the target user flow, and the core data model the platform is being built around. Tech stack and schema implementation are the next steps.
