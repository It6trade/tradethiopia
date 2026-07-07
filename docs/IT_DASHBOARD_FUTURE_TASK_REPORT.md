# IT Dashboard Future Task Enhancements

## Summary

The IT dashboard was extended with workflow controls, leader/admin task actions, staff reminders, and audit logging while preserving the existing task screens and current task fields.

## Additions

### Role-Based Task Actions

- IT Staff can move assigned work from pending/assigned to in progress and then submit it for review.
- IT Team Leaders and IT Managers can approve, reject, reassign, reopen, and complete tasks.
- IT Team Leaders are scoped to tasks where they are the task leader or personally assigned; they do not see all IT department tasks.
- Team leaders can view task actions for their own scoped tasks only.
- Existing comment and approval behavior remains available and now contributes to the task audit log.

### Task Leader Controls

- Task leaders remain separate from assigned staff.
- Leaders/managers can reassign the task leader and assigned staff from the IT overview.
- Team leader-created tasks are automatically attached to that team leader as the task leader.
- Reassignment automatically moves a pending task into the assigned workflow state.

### Manager Task Editing

- IT Manager/Admin users can edit and update tasks from Overview, Internal Projects, and External Projects.
- Editable fields include task/client name, project type, platform/category, action type, dates, status, workflow state, task leader, assigned staff, urgency, points, and progress notes.
- Manager edits are saved through the existing IT task update API and are recorded in the task audit log.

### Task Detail View

- Tasks can be opened into a detail view from Overview, Internal Projects, External Projects, and KPI task rows.
- The task detail view shows task metadata, leader, assigned staff, dates, platform/category, action type, points, approval state, and workflow state.
- A progress bar reflects the current task progress based on workflow/status.
- The detail view includes task comments and a comment form for feedback, blockers, and progress updates.
- Comments are saved through the IT task comment API and included in the audit log.

### Reminders

- A new Reminders section was added to the IT sidebar.
- The reminder queue includes generated reminders for overdue tasks, tasks due within three days, rejected work, and tasks waiting for review.
- Custom reminders can be added to tasks from the overview and marked complete from the Reminders page.
- The sidebar shows a reminder count badge.

### Advanced KPIs

- The IT KPI page now includes automatic KPI intelligence for daily, weekly, monthly, and yearly performance windows.
- KPI metrics are calculated from visible IT tasks and respect each user's role scope.
- Tracked metrics include task volume, completion rate, approval health, on-time delivery, overdue work, due-soon tasks, KPI points, average cycle time, and overall KPI score.
- The KPI page includes team performance ranking and recent KPI activity for the selected interval.
- The KPI page includes an interval detail panel for the selected daily, weekly, monthly, or yearly window.
- Daily KPI detail shows task-level work, owner, workflow, due date, and points.
- Monthly KPI detail shows weekly performance inside the month.
- Yearly KPI detail shows month-by-month performance for the year.
- The existing manual KPI scorecard remains available for saved KPI snapshots by day, week, month, and year.

### Audit Log

- Tasks now store action history for creation, updates, comments, workflow changes, reassignment, reminders, and approvals.
- IT Manager/Admin users can view the audit trail from Admin > Audit Log.

## New Backend Fields

- `workflowStatus`
- `progressNote`
- `submittedBy`, `submittedAt`
- `rejectedBy`, `rejectedAt`
- `reminders`
- `auditLog`

## New Backend Routes

- `POST /api/it/:id/workflow`
- `POST /api/it/:id/reassign`
- `POST /api/it/:id/reminders`
- `PATCH /api/it/:id/reminders/:reminderId`
- `GET /api/it/audit/all`

## Compatibility Notes

Older tasks remain compatible. When a task does not yet have `workflowStatus`, the frontend derives the workflow from the existing `status` field.
