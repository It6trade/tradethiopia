import React from 'react';
import Layout from './components/Layout';

const SalesAgentDashboard = ({ initialActiveItem = 'Home' }) => {
  return <Layout initialActiveItem={initialActiveItem} />;
};

export default SalesAgentDashboard;
