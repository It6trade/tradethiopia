const jobs = [];

const enqueue = async (name, payload = {}) => {
  const job = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    payload,
    status: 'queued',
    backend: 'placeholder',
    createdAt: new Date()
  };
  jobs.push(job);
  return job;
};

const listJobs = () => jobs.slice(-100).reverse();

const bullMqSetupNote = {
  enabled: false,
  reason: 'Redis/BullMQ is not configured in this project.',
  enablement: [
    'Install and configure redis.',
    'Install bullmq and ioredis.',
    'Replace backend/services/jobService.js enqueue/listJobs with Queue and Worker instances.',
    'Move PDF, CSV, payroll, month-end, and reconciliation matching workers into dedicated processors.'
  ]
};

module.exports = {
  enqueue,
  listJobs,
  bullMqSetupNote
};
