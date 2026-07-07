export const WORKFLOW_STEPS = [
  { value: 'pending', label: 'Pending', color: 'gray' },
  { value: 'assigned', label: 'Assigned', color: 'blue' },
  { value: 'in_progress', label: 'In Progress', color: 'cyan' },
  { value: 'submitted', label: 'Submitted', color: 'purple' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'completed', label: 'Completed', color: 'green' },
];

export const getWorkflowMeta = (value, status) => {
  const normalized = value || (status === 'done' ? 'completed' : status === 'ongoing' ? 'in_progress' : 'pending');
  return WORKFLOW_STEPS.find((step) => step.value === normalized) || WORKFLOW_STEPS[0];
};

export const getWorkflowActionForPersona = (task = {}, persona = {}) => {
  const workflow = getWorkflowMeta(task.workflowStatus, task.status).value;

  if (!persona.canApproveTasks) {
    if (['pending', 'assigned', 'rejected'].includes(workflow)) {
      return { next: 'in_progress', label: 'Start Work', color: 'blue' };
    }
    if (workflow === 'in_progress') {
      return { next: 'submitted', label: 'Submit Work', color: 'purple' };
    }
    return null;
  }

  if (workflow === 'submitted') {
    return { next: 'approved', label: 'Approve', color: 'green' };
  }
  if (workflow === 'approved') {
    return { next: 'completed', label: 'Complete', color: 'green' };
  }
  if (['pending', 'assigned'].includes(workflow)) {
    return { next: 'in_progress', label: 'Start', color: 'blue' };
  }
  if (workflow === 'rejected') {
    return { next: 'in_progress', label: 'Reopen', color: 'orange' };
  }
  return null;
};

export const getTaskTitle = (task = {}) => task.taskName || task.client || 'IT Task';

export const buildTaskReminders = (tasks = []) => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  return tasks.flatMap((task) => {
    const title = getTaskTitle(task);
    const due = task.endDate ? new Date(task.endDate).getTime() : null;
    const workflow = getWorkflowMeta(task.workflowStatus, task.status).value;
    const generated = [];

    if (due && task.status !== 'done' && workflow !== 'completed') {
      if (due < now) {
        generated.push({
          id: `${task._id || task.id}-overdue`,
          taskId: task._id || task.id,
          title: `${title} is overdue`,
          note: 'Deadline passed. Review progress or submit an update.',
          type: 'deadline',
          urgency: 'critical',
          dueAt: task.endDate,
        });
      } else if (due - now <= 3 * day) {
        generated.push({
          id: `${task._id || task.id}-due-soon`,
          taskId: task._id || task.id,
          title: `${title} is due soon`,
          note: 'Due within the next 3 days.',
          type: 'deadline',
          urgency: 'warning',
          dueAt: task.endDate,
        });
      }
    }

    if (workflow === 'submitted') {
      generated.push({
        id: `${task._id || task.id}-review`,
        taskId: task._id || task.id,
        title: `${title} is waiting for review`,
        note: 'Leader or manager action is required.',
        type: 'review',
        urgency: 'info',
      });
    }

    if (workflow === 'rejected') {
      generated.push({
        id: `${task._id || task.id}-rejected`,
        taskId: task._id || task.id,
        title: `${title} needs changes`,
        note: task.approvalNote || 'Review feedback and resubmit the work.',
        type: 'action',
        urgency: 'critical',
      });
    }

    const custom = (task.reminders || [])
      .filter((reminder) => !reminder.isDone)
      .map((reminder) => ({
        id: reminder._id || `${task._id || task.id}-${reminder.title}`,
        taskId: task._id || task.id,
        reminderId: reminder._id,
        title: reminder.title,
        note: reminder.note,
        type: reminder.type || 'task',
        urgency: reminder.dueAt && new Date(reminder.dueAt).getTime() < now ? 'critical' : 'info',
        dueAt: reminder.dueAt,
        custom: true,
      }));

    return [...generated, ...custom];
  });
};
