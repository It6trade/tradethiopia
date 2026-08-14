
import React, { useState, useEffect } from 'react';
import { Button, FormControl, FormLabel, Input, Select, useToast, Textarea } from '@chakra-ui/react';
import axios from 'axios';

const AssetForm = ({ fetchAssets, assetToEdit, setAssetToEdit }) => {
  const [name, setName] = useState('');
  const [nameTag, setNameTag] = useState('');
  const [assets, setAssets] = useState('');
  const [location, setLocation] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [status, setStatus] = useState('Active');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [dateAcquired, setDateAcquired] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState([]);
  const toast = useToast(); // Initialize the toast

  // Populate form fields if editing an asset
  useEffect(() => {
    if (assetToEdit) {
      setName(assetToEdit.name);
      setNameTag(assetToEdit.nameTag);
      setAssets(assetToEdit.assets);
      setLocation(assetToEdit.location);
      setAssignedTo(assetToEdit.assignedTo);
      setStatus(assetToEdit.status);
      setAmount(assetToEdit.amount);
      setCategory(assetToEdit.category);
      setDateAcquired(assetToEdit.dateAcquired.split('T')[0]);
      setDescription(assetToEdit.description);
    } else {
      setName('');
      setNameTag('');
      setAssets('');
      setLocation('');
      setAssignedTo('');
      setStatus('Active');
      setAmount('');
      setCategory('');
      setDateAcquired('');
      setDescription('');
    }
  }, [assetToEdit]);
// Fetch users from the API when the component mounts
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
      console.log("API Response:", response.data); // Log the response

      // Ensure the response is an array
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        // If the response is an object with a data property
        setUsers(response.data.data);
      } else {
        console.error("Unexpected API response format:", response.data);
        setUsers([]); // Fallback to an empty array
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]); // Fallback to an empty array
    }
  };

  fetchUsers();
}, []);
  const handleAssignedToChange = (e) => {
    const value = e.target.value;
    if (value && value[0] !== value[0].toUpperCase()) {
      alert("The first letter of 'Assigned To' must be capitalized.");
    }
    setAssignedTo(value.charAt(0).toUpperCase() + value.slice(1));
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value && value[0] !== value[0].toUpperCase()) {
      alert("The first letter of 'Category' must be capitalized.");
    }
    setCategory(value.charAt(0).toUpperCase() + value.slice(1));
  };
  const handleLocationChange = (e) => {
    const value = e.target.value;
    if (value && value[0] !== value[0].toUpperCase()) {
      alert("The first letter of 'Category' must be capitalized.");
    }
    setLocation(value.charAt(0).toUpperCase() + value.slice(1));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!name || !nameTag || !assets || !location || !assignedTo || !status || !amount || !category || !dateAcquired) {
      window.alert("Please fill in all fields.");
      return;
    }

    try {
      if (assetToEdit) {
        // Update existing asset
        await axios.put(`${import.meta.env.VITE_API_URL}/api/assets/${assetToEdit._id}`, {
          name,
          nameTag,
          assets,
          location,
          assignedTo,
          status,
          amount: parseFloat(amount),
          category,
          dateAcquired,
          description,
        });
        toast({
          title: "Asset Updated.",
          description: "The asset has been updated successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Create new asset
        await axios.post(`${import.meta.env.VITE_API_URL}/api/assets`, {
          name,
          nameTag,
          assets,
          location,
          assignedTo,
          status,
          amount: parseFloat(amount),
          category,
          dateAcquired: new Date(dateAcquired).toISOString(),
          description,
        });
        toast({
          title: "Asset Added.",
          description: "The asset has been added successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }
      // Refresh the asset list
      fetchAssets();
      // Clear the form
      setAssetToEdit(null);
    } catch (error) {
      console.error("Error posting asset:", error.response.data);
      alert("Failed to add/update asset: " + (error.response.data.message || error.message));
    }
  };


return (
    <form onSubmit={handleSubmit}>
      <FormControl mb={4}>
        <FormLabel>Name</FormLabel>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter asset name"
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Name Tag</FormLabel>
        <Input
          value={nameTag}
          onChange={(e) => setNameTag(e.target.value)}
          placeholder="Enter asset name tag"
        />
      </FormControl>
      <FormLabel>Group</FormLabel>
      <FormControl>
        <Select
          value={assets}
          onChange={(e) => setAssets(e.target.value)}
          placeholder="Select asset type"
        >
          <option value="Tangible">Tangible Asset</option>
          <option value="Intangible">Intangible Asset</option>
        </Select>
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Location</FormLabel>
        <Input
          value={location}
          onChange={handleLocationChange}
          placeholder="Enter asset location"
        />
      </FormControl>
      <FormControl mb={4}>
  <FormLabel>Assigned To</FormLabel>
  <Select
    value={assignedTo}
    onChange={(e) => setAssignedTo(e.target.value)}
    placeholder="Select assigned person"
  >
    {Array.isArray(users) && users.map((user) => (
      <option key={user._id} value={user.username}>
        {user.username}
      </option>
    ))}
  </Select>
</FormControl>
      <FormControl mb={4}>
        <FormLabel>Status</FormLabel>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Under Maintenance">Under Maintenance</option>
        </Select>
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Amount</FormLabel>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter asset amount"
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Category</FormLabel>
        <Input
          value={category}
          onChange={handleCategoryChange} // Use the new handler
          placeholder="Enter asset category"
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Date Acquired</FormLabel>
        <Input
          type="date"
          value={dateAcquired}
          onChange={(e) => setDateAcquired(e.target.value)}
        />
      </FormControl>
      <FormControl mb={4}>
  <FormLabel>Description</FormLabel>
  <Textarea
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    placeholder="Enter asset description"
    rows={4} // You can adjust the number of rows based on your needs
  />
</FormControl>
      <Button type="submit" colorScheme="teal">
        {assetToEdit ? 'Update Asset' : 'Add Asset'}
      </Button>
    </form>
  );
};

export default AssetForm;