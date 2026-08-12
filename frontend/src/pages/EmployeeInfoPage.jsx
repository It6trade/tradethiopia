import { Box } from '@chakra-ui/react';
import EmployeeInfoForm from './EmployeeInfoForm';
import './EmployeeInfoForm.css';

const EmployeeInfoPage = () => (
  <Box minH="100vh" bg="#eef3f6" py={{ base: 0, md: 8 }} px={{ base: 0, md: 4 }}>
    <EmployeeInfoForm />
  </Box>
);

export default EmployeeInfoPage;
