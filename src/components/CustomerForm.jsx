const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

useEffect(() => {
  if (id) {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/customers/${id}`, {
          credentials: 'include',
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setFormData(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching customer:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomer();
  }
}, [id]);

const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    setSubmitting(true);
    
    const url = id 
      ? `http://localhost:5000/api/customers/${id}` 
      : 'http://localhost:5000/api/customers';
    
    const method = id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(formData),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    // Redirect to customers list on success
    navigate('/customers');
  } catch (err) {
    setError(err.message);
    console.error('Error saving customer:', err);
  } finally {
    setSubmitting(false);
  }
}; 