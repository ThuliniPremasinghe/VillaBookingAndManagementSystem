import React, { useState, useEffect, useCallback } from 'react';
import { 
  DatePicker, 
  Table, 
  Card, 
  Statistic, 
  Tabs, 
  Row, 
  Col,
  Radio,
  Space,
  Alert,
  Button,
  notification,
  Spin,
  Empty
} from 'antd';
import axios from 'axios';
import moment from 'moment';
import AdminSidebar from "./AdminSidebar";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DownloadOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

function formatCurrency(value) {
  if (value === null || value === undefined) return '$0.00';
  const num = Number(value);
  return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
}

const api = axios.create({
  baseURL: 'http://localhost:3037/api/report',
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 500) {
        notification.error({
          message: 'Server Error',
          description: 'The server encountered an error. Please try again later.',
        });
      } else if (error.response.status === 404) {
        notification.error({
          message: 'Not Found',
          description: 'The requested resource was not found.',
        });
      } else if (error.response.status === 401) {
        notification.error({
          message: 'Unauthorized',
          description: 'Please log in again to continue.',
        });
      }
    } else if (error.request) {
      notification.error({
        message: 'Connection Error',
        description: 'Could not connect to the server. Please check your network connection.',
      });
    } else {
      notification.error({
        message: 'Request Error',
        description: error.message,
      });
    }
    return Promise.reject(error);
  }
);

const RevenueReport = () => {
  const [activeTab, setActiveTab] = useState('revenue');
  const [dateRange, setDateRange] = useState([
    moment().subtract(30, 'days'),
    moment()
  ]);
  const [revenueGroupBy, setRevenueGroupBy] = useState('day');
  const [reservationGroupBy, setReservationGroupBy] = useState('property');
  const [loading, setLoading] = useState(false);
  const [revenueData, setRevenueData] = useState([]);
  const [reservationData, setReservationData] = useState([]);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const exportToPDF = async () => {
    try {
      notification.info({
        message: 'Preparing PDF',
        description: 'Generating PDF report...',
        duration: 2
      });
  
      // Hide elements that shouldn't be in PDF
      const elementsToHide = document.querySelectorAll('.no-export');
      elementsToHide.forEach(el => el.style.visibility = 'hidden');
  
      // Create a new div for PDF content
      const pdfContent = document.createElement('div');
      pdfContent.style.width = '800px';
      pdfContent.style.padding = '40px';
      pdfContent.style.backgroundColor = 'white';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      
      // Add company header with invoice-like styling
      const companyHeader = document.createElement('div');
      companyHeader.style.marginBottom = '30px';
      companyHeader.style.borderBottom = '2px solid #eee';
      companyHeader.style.paddingBottom = '20px';
      
      const companyName = document.createElement('h1');
      companyName.textContent = 'Villa Thus';
      companyName.style.margin = '0';
      companyName.style.color = '#2E5984';
      companyName.style.fontSize = '24px';
      companyName.style.fontWeight = 'bold';
      companyName.style.textAlign = 'left';
      companyHeader.appendChild(companyName);
      
      const companyAddress = document.createElement('div');
      companyAddress.textContent = '459/2/1, Abimangama Road, Gintota, Galle, Sri Lanka';
      companyAddress.style.margin = '8px 0';
      companyAddress.style.fontSize = '14px';
      companyAddress.style.color = '#666';
      companyAddress.style.textAlign = 'left';
      companyHeader.appendChild(companyAddress);
      
      const companyContact = document.createElement('div');
      companyContact.textContent = '+94 77 232 8333 | info@villathus.com';
      companyContact.style.margin = '8px 0';
      companyContact.style.fontSize = '14px';
      companyContact.style.color = '#666';
      companyContact.style.textAlign = 'left';
      companyHeader.appendChild(companyContact);
      
      pdfContent.appendChild(companyHeader);
      
      // Add report header with invoice styling
      const reportHeader = document.createElement('div');
      reportHeader.style.display = 'flex';
      reportHeader.style.justifyContent = 'space-between';
      reportHeader.style.marginBottom = '30px';
      
      const reportDetails = document.createElement('div');
      reportDetails.style.textAlign = 'left';
      
      const reportTitle = document.createElement('h2');
      reportTitle.textContent = activeTab === 'revenue' ? 'REVENUE REPORT' : 'RESERVATION REPORT';
      reportTitle.style.fontSize = '20px';
      reportTitle.style.margin = '0 0 10px 0';
      reportTitle.style.color = '#444';
      reportTitle.style.fontWeight = 'bold';
      reportDetails.appendChild(reportTitle);
      
      const dateRangeText = document.createElement('div');
      dateRangeText.textContent = `Date Range: ${dateRange[0].format('MMMM D, YYYY')} - ${dateRange[1].format('MMMM D, YYYY')}`;
      dateRangeText.style.fontSize = '14px';
      dateRangeText.style.color = '#666';
      dateRangeText.style.marginBottom = '5px';
      reportDetails.appendChild(dateRangeText);
      
      const reportDate = document.createElement('div');
      reportDate.textContent = `Generated: ${moment().format('MMMM D, YYYY h:mm A')}`;
      reportDate.style.fontSize = '14px';
      reportDate.style.color = '#666';
      reportDetails.appendChild(reportDate);
      
      reportHeader.appendChild(reportDetails);
      
      // Add report number (like invoice number)
      const reportNumberContainer = document.createElement('div');
      reportNumberContainer.style.textAlign = 'right';
      
      const reportNumberLabel = document.createElement('div');
      reportNumberLabel.textContent = 'REPORT #';
      reportNumberLabel.style.fontSize = '14px';
      reportNumberLabel.style.fontWeight = 'bold';
      reportNumberLabel.style.color = '#444';
      reportNumberLabel.style.marginBottom = '5px';
      reportNumberContainer.appendChild(reportNumberLabel);
      
      const reportNumber = document.createElement('div');
      reportNumber.textContent = `REPORT-${moment().format('YYYYMMDD-HHmmss')}`;
      reportNumber.style.fontSize = '16px';
      reportNumber.style.color = '#333';
      reportNumberContainer.appendChild(reportNumber);
      
      reportHeader.appendChild(reportNumberContainer);
      pdfContent.appendChild(reportHeader);
  
      // Add summary section with invoice-like styling
      const summaryContainer = document.createElement('div');
      summaryContainer.style.display = 'flex';
      summaryContainer.style.justifyContent = 'space-between';
      summaryContainer.style.marginBottom = '30px';
      summaryContainer.style.padding = '20px';
      summaryContainer.style.backgroundColor = '#f9f9f9';
      summaryContainer.style.borderRadius = '4px';
      summaryContainer.style.border = '1px solid #eee';
      
      if (activeTab === 'revenue') {
        // Total Revenue
        const totalRevenueDiv = document.createElement('div');
        const totalRevenueLabel = document.createElement('div');
        totalRevenueLabel.textContent = 'TOTAL REVENUE';
        totalRevenueLabel.style.fontSize = '14px';
        totalRevenueLabel.style.marginBottom = '8px';
        totalRevenueLabel.style.color = '#555';
        totalRevenueLabel.style.fontWeight = 'bold';
        totalRevenueDiv.appendChild(totalRevenueLabel);
        
        const totalRevenueValue = document.createElement('div');
        totalRevenueValue.textContent = formatCurrency(revenueTotals.total_revenue);
        totalRevenueValue.style.fontSize = '18px';
        totalRevenueValue.style.fontWeight = 'normal';
        totalRevenueValue.style.color = '#555';
        totalRevenueDiv.appendChild(totalRevenueValue);
        summaryContainer.appendChild(totalRevenueDiv);
        
        // Collected Amount
        const collectedAmountDiv = document.createElement('div');
        const collectedAmountLabel = document.createElement('div');
        collectedAmountLabel.textContent = 'COLLECTED AMOUNT';
        collectedAmountLabel.style.fontSize = '14px';
        collectedAmountLabel.style.marginBottom = '8px';
        collectedAmountLabel.style.color = '#555';
        collectedAmountLabel.style.fontWeight = 'bold';
        collectedAmountDiv.appendChild(collectedAmountLabel);
        
        const collectedAmountValue = document.createElement('div');
        collectedAmountValue.textContent = formatCurrency(revenueTotals.collected_amount);
        collectedAmountValue.style.fontSize = '18px';
        collectedAmountValue.style.fontWeight = 'normal';
        collectedAmountValue.style.color = '#555';
        collectedAmountDiv.appendChild(collectedAmountValue);
        summaryContainer.appendChild(collectedAmountDiv);
        
        // Unpaid Amount
        const unpaidAmountDiv = document.createElement('div');
        const unpaidAmountLabel = document.createElement('div');
        unpaidAmountLabel.textContent = 'UNPAID AMOUNT';
        unpaidAmountLabel.style.fontSize = '14px';
        unpaidAmountLabel.style.marginBottom = '8px';
        unpaidAmountLabel.style.color = '#555';
        unpaidAmountLabel.style.fontWeight = 'bold';
        unpaidAmountDiv.appendChild(unpaidAmountLabel);
        
        const unpaidAmountValue = document.createElement('div');
        unpaidAmountValue.textContent = formatCurrency(revenueTotals.unpaid_amount);
        unpaidAmountValue.style.fontSize = '18px';
        unpaidAmountValue.style.fontWeight = 'normal';
        unpaidAmountValue.style.color = '#555';
        unpaidAmountDiv.appendChild(unpaidAmountValue);
        summaryContainer.appendChild(unpaidAmountDiv);
      } else {
        // Reservation summary stats
        const totalBookingsDiv = document.createElement('div');
        const totalBookingsLabel = document.createElement('div');
        totalBookingsLabel.textContent = 'TOTAL BOOKINGS';
        totalBookingsLabel.style.fontSize = '14px';
        totalBookingsLabel.style.marginBottom = '8px';
        totalBookingsLabel.style.color = '#555';
        totalBookingsLabel.style.fontWeight = 'normal';
        totalBookingsDiv.appendChild(totalBookingsLabel);
        
        const totalBookingsValue = document.createElement('div');
        totalBookingsValue.textContent = reservationTotals.total_bookings;
        totalBookingsValue.style.fontSize = '18px';
        totalBookingsValue.style.fontWeight = 'bold';
        totalBookingsDiv.appendChild(totalBookingsValue);
        summaryContainer.appendChild(totalBookingsDiv);
        
        // Completed Bookings
        const completedDiv = document.createElement('div');
        const completedLabel = document.createElement('div');
        completedLabel.textContent = 'COMPLETED';
        completedLabel.style.fontSize = '14px';
        completedLabel.style.marginBottom = '8px';
        completedLabel.style.color = '#555';
        completedLabel.style.fontWeight = 'normal';
        completedDiv.appendChild(completedLabel);
        
        const completedValue = document.createElement('div');
        completedValue.textContent = reservationTotals.completed_bookings;
        completedValue.style.fontSize = '18px';
        completedValue.style.fontWeight = 'bold';
        completedValue.style.color = '#555';
        completedDiv.appendChild(completedValue);
        summaryContainer.appendChild(completedDiv);
        
        // Actual Revenue
        const actualRevenueDiv = document.createElement('div');
        const actualRevenueLabel = document.createElement('div');
        actualRevenueLabel.textContent = 'ACTUAL REVENUE';
        actualRevenueLabel.style.fontSize = '14px';
        actualRevenueLabel.style.marginBottom = '8px';
        actualRevenueLabel.style.color = '#555';
        actualRevenueLabel.style.fontWeight = 'normal';
        actualRevenueDiv.appendChild(actualRevenueLabel);
        
        const actualRevenueValue = document.createElement('div');
        actualRevenueValue.textContent = formatCurrency(reservationTotals.actual_revenue);
        actualRevenueValue.style.fontSize = '18px';
        actualRevenueValue.style.fontWeight = 'bold';
        actualRevenueDiv.appendChild(actualRevenueValue);
        summaryContainer.appendChild(actualRevenueDiv);
      }
      
      pdfContent.appendChild(summaryContainer);
  
      // Create a container div for the framed table
      const tableContainer = document.createElement('div');
      tableContainer.style.border = '1px solid #ddd';
      tableContainer.style.borderRadius = '4px';
      tableContainer.style.overflow = 'hidden';
      tableContainer.style.marginBottom = '30px';
  
      // Create table with invoice-like styling
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '14px';
      
      // Add table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.backgroundColor = '#B6D0E2';
      headerRow.style.color = '#000000';
      
      const columns = activeTab === 'revenue' ? getRevenueColumns() : getReservationColumns();
      columns.forEach((column, index) => {
        const th = document.createElement('th');
        th.textContent = column.title.toUpperCase();
        th.style.padding = '12px';
        th.style.textAlign = 'left';
        th.style.fontWeight = 'bold';
        th.style.color = '#444';
        th.style.borderBottom = '2px solid #ddd';
        if (index < columns.length - 1) {
          th.style.borderRight = '1px solid #ddd';
        }
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
  
      // Add table body
      const tbody = document.createElement('tbody');
      const data = activeTab === 'revenue' ? revenueData : reservationData;
      
      data.forEach((item, rowIndex) => {
        const row = document.createElement('tr');
        if (rowIndex % 2 === 0) {
          row.style.color = '#000000';
          row.style.backgroundColor = '#ffffff';
        }
        
        columns.forEach((column, colIndex) => {
          const cell = document.createElement('td');
          let content = '';
          
          if (column.render) {
            content = column.render(item[column.dataIndex], item);
          } else {
            content = item[column.dataIndex] || 'N/A';
          }
          
          cell.textContent = content;
          cell.style.padding = '12px';
          cell.style.textAlign = 'left';
          cell.style.borderBottom = '1px solid #eee';
          if (colIndex < columns.length - 1) {
            cell.style.borderRight = '1px solid #eee';
          }
          
          if ((column.dataIndex && column.dataIndex.includes('revenue'))) {
            cell.style.fontWeight = 'normal';
            cell.style.color = '#000000';
          }
          
          row.appendChild(cell);
        });
        
        tbody.appendChild(row);
      });
      
      // Add totals row with invoice-like styling
      const footerRow = document.createElement('tr');
      footerRow.style.backgroundColor = '#B6D0E2';
      footerRow.style.color = '#000000';
      footerRow.style.fontWeight = 'bold';

      const totalLabelCell = document.createElement('td');
      totalLabelCell.textContent = 'TOTALS';
      totalLabelCell.style.padding = '12px 15px';
      totalLabelCell.style.textAlign = 'left';
      totalLabelCell.style.borderBottom = '1px solid #ddd';
      totalLabelCell.style.borderRight = '1px solid #ddd';
      footerRow.appendChild(totalLabelCell);

      if (activeTab === 'revenue') {
        const totalRevenueCell = document.createElement('td');
        totalRevenueCell.textContent = formatCurrency(revenueTotals.total_revenue);
        totalRevenueCell.style.padding = '15px';
        totalRevenueCell.style.textAlign = 'left';
        totalRevenueCell.style.borderBottom = '1px solid #ddd';
        totalRevenueCell.style.borderRight = '1px solid #ddd';
        totalRevenueCell.style.color = '#00000';
        footerRow.appendChild(totalRevenueCell);
        
        const totalCollectedCell = document.createElement('td');
        totalCollectedCell.textContent = formatCurrency(revenueTotals.collected_amount);
        totalCollectedCell.style.padding = '15px';
        totalCollectedCell.style.textAlign = 'left';
        totalCollectedCell.style.borderBottom = '1px solid #ddd';
        totalCollectedCell.style.borderRight = '1px solid #ddd';
        footerRow.appendChild(totalCollectedCell);
        
        const unpaidAmountCell = document.createElement('td');
        unpaidAmountCell.textContent = formatCurrency(revenueTotals.unpaid_amount);
        unpaidAmountCell.style.padding = '15px';
        unpaidAmountCell.style.textAlign = 'left';
        unpaidAmountCell.style.borderBottom = '1px solid #ddd';
        unpaidAmountCell.style.borderRight = '1px solid #ddd';
        unpaidAmountCell.style.color = '#000';
        footerRow.appendChild(unpaidAmountCell);
        
        const totalBookingsCell = document.createElement('td');
        totalBookingsCell.textContent = revenueTotals.booking_count;
        totalBookingsCell.style.padding = '15px';
        totalBookingsCell.style.textAlign = 'left';
        totalBookingsCell.style.borderBottom = '1px solid #ddd';
        totalBookingsCell.style.borderRight = '1px solid #ddd';
        footerRow.appendChild(totalBookingsCell);
      } else {
        // Total Bookings
        const totalBookingsCell = document.createElement('td');
        totalBookingsCell.textContent = reservationTotals.total_bookings;
        totalBookingsCell.style.padding = '12px 15px';
        totalBookingsCell.style.textAlign = 'left';
        totalBookingsCell.style.borderBottom = '1px solid #ddd';
        totalBookingsCell.style.borderRight = '1px solid #ddd';
        footerRow.appendChild(totalBookingsCell);
      
        // Completed
        const completedCell = document.createElement('td');
        completedCell.textContent = reservationTotals.completed_bookings;
        completedCell.style.padding = '12px 15px';
        completedCell.style.textAlign = 'left';
        completedCell.style.borderBottom = '1px solid #ddd';
        completedCell.style.borderRight = '1px solid #ddd';
        footerRow.appendChild(completedCell);
      
        // Checked In
        const checkedInCell = document.createElement('td');
        checkedInCell.textContent = reservationTotals.checked_in_bookings;
        checkedInCell.style.padding = '12px 15px';
        checkedInCell.style.textAlign = 'left';
        checkedInCell.style.borderBottom = '1px solid #ddd';
        checkedInCell.style.borderRight = '1px solid #ddd';
        footerRow.appendChild(checkedInCell);
      
        // Pending
        const pendingCell = document.createElement('td');
        pendingCell.textContent = reservationTotals.pending_bookings;
        pendingCell.style.padding = '12px 15px';
        pendingCell.style.textAlign = 'left';
        pendingCell.style.borderBottom = '1px solid #ddd';
        pendingCell.style.borderRight = '1px solid #ddd';
        footerRow.appendChild(pendingCell);
      
        // Cancelled
        const cancelledCell = document.createElement('td');
        cancelledCell.textContent = reservationTotals.cancelled_bookings;
        cancelledCell.style.padding = '12px 15px';
        cancelledCell.style.textAlign = 'left';
        cancelledCell.style.borderBottom = '1px solid #ddd';
        cancelledCell.style.borderRight = '1px solid #ddd';
        footerRow.appendChild(cancelledCell);
      
        // Potential Revenue
        const potentialCell = document.createElement('td');
        potentialCell.textContent = formatCurrency(reservationTotals.potential_revenue);
        potentialCell.style.padding = '12px 15px';
        potentialCell.style.textAlign = 'left';
        potentialCell.style.borderBottom = '1px solid #ddd';
        potentialCell.style.borderRight = '1px solid #ddd';
        footerRow.appendChild(potentialCell);
      
        // Actual Revenue
        const actualCell = document.createElement('td');
        actualCell.textContent = formatCurrency(reservationTotals.actual_revenue);
        actualCell.style.padding = '12px 15px';
        actualCell.style.textAlign = 'left';
        actualCell.style.borderBottom = '1px solid #ddd';
        footerRow.appendChild(actualCell);
      }
      
      tbody.appendChild(footerRow);
      table.appendChild(tbody);
      
      // Add table to container
      tableContainer.appendChild(table);
      pdfContent.appendChild(tableContainer);
  
      // Add footer note
      const footerNote = document.createElement('div');
      footerNote.style.marginTop = '30px';
      footerNote.style.paddingTop = '20px';
      footerNote.style.borderTop = '1px solid #eee';
      footerNote.style.fontSize = '12px';
      footerNote.style.color = '#666';
      footerNote.style.textAlign = 'center';
      
      const note1 = document.createElement('div');
      note1.textContent = 'This report is generated automatically by the Villa Thus management system.';
      note1.style.marginBottom = '5px';
      footerNote.appendChild(note1);
      
      const note2 = document.createElement('div');
      note2.textContent = 'For any questions regarding this report, please contact our support team.';
      footerNote.appendChild(note2);
      
      pdfContent.appendChild(footerNote);
  
      // Add to document
      document.body.appendChild(pdfContent);
  
      // Convert to canvas
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: true
      });
  
      // Clean up
      document.body.removeChild(pdfContent);
      elementsToHide.forEach(el => el.style.visibility = 'visible');
  
      // Create PDF
      const pdf = new jsPDF('portrait');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      
      // Add title and metadata
      pdf.setProperties({
        title: activeTab === 'revenue' ? 'Revenue Report' : 'Reservation Report',
        subject: 'Property Management Report',
        author: 'Villa Thus',
        keywords: 'report, revenue, villa thus',
        creator: 'Villa Thus Management System'
      });
  
      // Generate filename with current date
      const dateStr = moment().format('YYYY-MM-DD_HH-mm-ss');
      pdf.save(`${activeTab === 'revenue' ? 'revenue' : 'reservation'}_report_${dateStr}.pdf`);
  
      notification.success({
        message: 'Export Successful',
        description: 'PDF report has been downloaded',
        duration: 2
      });
  
    } catch (error) {
      console.error('PDF export error:', error);
      notification.error({
        message: 'Export Failed',
        description: 'Could not generate PDF report',
      });
    }
  };
  
  const validateDataConsistency = (revData, resData) => {
    if (!Array.isArray(revData) || !Array.isArray(resData)) return;
    
    const revProps = new Set(revData.filter(item => item?.propertyId).map(item => item.propertyId));
    const resProps = new Set(resData.filter(item => item?.propertyId).map(item => item.propertyId));
    
    if (revProps.size !== resProps.size) {
      notification.warning({
        message: 'Data Consistency Warning',
        description: 'The reports show different sets of properties',
      });
    }
  };

  const fetchData = useCallback(async () => {
    if (!dateRange || dateRange.length !== 2) {
      setError('Please select a valid date range');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const [revenueResponse, reservationResponse] = await Promise.all([
        api.get('/revenue', {
          params: {
            startDate: dateRange[0].format('YYYY-MM-DD'),
            endDate: dateRange[1].format('YYYY-MM-DD'),
            groupBy: revenueGroupBy
          }
        }),
        api.get('/reservations', {
          params: {
            startDate: dateRange[0].format('YYYY-MM-DD'),
            endDate: dateRange[1].format('YYYY-MM-DD'),
            groupBy: reservationGroupBy
          }
        })
      ]);
      
      if (!revenueResponse.data || !reservationResponse.data) {
        throw new Error('Received empty data from API');
      }
      
      const formattedRevenueData = revenueResponse.data.map(item => {
        const formattedItem = { ...item };
        
        if (revenueGroupBy === 'day' && formattedItem.date) {
          formattedItem.date = moment(formattedItem.date).format('YYYY-MM-DD');
        }
        else if (revenueGroupBy === 'week' && formattedItem.week) {
          const year = String(formattedItem.week).substring(0, 4);
          const week = String(formattedItem.week).substring(4);
          formattedItem.week = `${year} Week ${week}`;
        }
        else if (revenueGroupBy === 'month' && formattedItem.month) {
          formattedItem.month = moment(formattedItem.month, 'YYYY-MM').format('MMMM YYYY');
        }
        
        return formattedItem;
      });
      
      const uniqueRevenueData = formattedRevenueData.filter((item, index, self) => {
        const keyField = revenueGroupBy === 'day' ? 'date' : 
                        revenueGroupBy === 'week' ? 'week' : 
                        revenueGroupBy === 'month' ? 'month' : 
                        'propertyId';
        
        return index === self.findIndex((t) => (
          t[keyField] === item[keyField]
        ));
      });
      
      const uniqueReservationData = reservationResponse.data.filter((item, index, self) => {
        const keyField = reservationGroupBy === 'property' ? 'propertyId' : reservationGroupBy;
        return index === self.findIndex((t) => (
          t[keyField] === item[keyField]
        ));
      });
      
      const transformedRevenue = uniqueRevenueData.map(item => ({
        ...item,
        total_revenue: item.total_revenue || 0,
        collected_amount: item.collected_amount || 0,
        booking_count: item.booking_count || 0,
        key: generateKeyFromItem(item, revenueGroupBy)
      }));
      
      const transformedReservations = uniqueReservationData.map(item => ({
        ...item,
        total_bookings: item.total_bookings || 0,
        completed_bookings: item.completed_bookings || 0,
        pending_bookings: item.pending_bookings || 0,
        cancelled_bookings: item.cancelled_bookings || 0,
        checked_in_bookings: item.checked_in_bookings || 0,
        potential_revenue: item.potential_revenue || 0,
        actual_revenue: item.actual_revenue || 0,
        key: generateKeyFromItem(item, reservationGroupBy)
      }));
      
      setRevenueData(transformedRevenue);
      setReservationData(transformedReservations);
      validateDataConsistency(transformedRevenue, transformedReservations);
      setRetryCount(0);
      
    } catch (error) {
      console.error('Full API Error:', {
        message: error.message,
        response: error.response,
        config: error.config
      });
      
      setError(`Failed to load report data: ${error.message}`);
      
      if (error.response && error.response.status === 500 && retryCount < 3) {
        notification.info({
          message: 'Retrying...',
          description: `Attempt ${retryCount + 1}/3 to connect to the server.`,
        });
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchData(), 3000);
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange, revenueGroupBy, reservationGroupBy, retryCount]);

  const generateKeyFromItem = (item, groupBy) => {
    if (!item) return Math.random().toString();
    
    if (groupBy === 'day') return `day-${item.date || Math.random()}`;
    if (groupBy === 'week') return `week-${item.week || Math.random()}`;
    if (groupBy === 'month') return `month-${item.month || Math.random()}`;
    if (groupBy === 'property') return `prop-${item.propertyId || Math.random()}`;
   
    return `item-${Math.random()}`;
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (dateRange && dateRange.length === 2) {
      fetchData();
    }
  }, [revenueGroupBy, reservationGroupBy, dateRange, fetchData]);

  const calculateRevenueTotals = () => {
    const totals = {
      total_revenue: 0,
      collected_amount: 0,
      unpaid_amount: 0,
      booking_count: 0,
      fully_paid_revenue: 0,
      fully_paid_collected: 0,
      deposit_paid_revenue: 0,
      deposit_paid_collected: 0,
      unpaid_revenue: 0
    };
    
    if (!Array.isArray(revenueData)) return totals;
    
    revenueData.forEach(item => {
      totals.total_revenue += parseFloat(item.total_revenue) || 0;
      totals.collected_amount += parseFloat(item.collected_amount) || 0;
      totals.unpaid_amount += parseFloat(item.unpaid_amount) || 0;
      totals.booking_count += parseInt(item.booking_count) || 0;
      totals.fully_paid_revenue += parseFloat(item.fully_paid_revenue) || 0;
      totals.fully_paid_collected += parseFloat(item.fully_paid_collected) || 0;
      totals.deposit_paid_revenue += parseFloat(item.deposit_paid_revenue) || 0;
      totals.deposit_paid_collected += parseFloat(item.deposit_paid_collected) || 0;
      totals.unpaid_revenue += parseFloat(item.unpaid_revenue) || 0;
    });
    
    return totals;
  };

  const calculateReservationTotals = () => {
    const totals = {
      total_bookings: 0,
      completed_bookings: 0,
      checked_in_bookings: 0,
      pending_bookings: 0,
      cancelled_bookings: 0,
      potential_revenue: 0,
      actual_revenue: 0
    };
    
    if (!Array.isArray(reservationData)) return totals;
    
    reservationData.forEach(item => {
      totals.total_bookings += parseInt(item.total_bookings) || 0;
      totals.completed_bookings += parseInt(item.completed_bookings) || 0;
      totals.checked_in_bookings += parseInt(item.checked_in_bookings) || 0;
      totals.pending_bookings += parseInt(item.pending_bookings) || 0;
      totals.cancelled_bookings += parseInt(item.cancelled_bookings) || 0;
      totals.potential_revenue += parseFloat(item.potential_revenue) || 0;
      totals.actual_revenue += parseFloat(item.actual_revenue) || 0;
    });
    
    return totals;
  };

  const revenueTotals = calculateRevenueTotals();
  const reservationTotals = calculateReservationTotals();

  const getRevenueColumns = () => {
    const baseColumns = [
      {
        title: revenueGroupBy === 'day' ? 'Date' : 
              revenueGroupBy === 'week' ? 'Week' :
              revenueGroupBy === 'month' ? 'Month' :
              revenueGroupBy === 'property' ? 'Property' : 'Group',
        dataIndex: revenueGroupBy === 'day' ? 'date' : 
                 revenueGroupBy === 'week' ? 'week' :
                 revenueGroupBy === 'month' ? 'month' :
                 revenueGroupBy === 'property' ? 'propertyId' : 'date',
        key: 'group',
        fixed: 'left',
        render: (text, record) => {
          if (revenueGroupBy === 'property') {
            return `Property ${text} `;
          }
          return text || 'N/A';
        },
        sorter: (a, b) => {
          if (revenueGroupBy === 'day') {
            return moment(a.date).valueOf() - moment(b.date).valueOf();
          } else if (revenueGroupBy === 'week') {
            const aWeek = a.week ? a.week.replace(/[^0-9]/g, '') : 0;
            const bWeek = b.week ? b.week.replace(/[^0-9]/g, '') : 0;
            return aWeek - bWeek;
          } else if (revenueGroupBy === 'month') {
            return moment(a.month, 'MMMM YYYY').valueOf() - moment(b.month, 'MMMM YYYY').valueOf();
          }
          return 0;
        }
      },
      {
        title: 'Total Revenue',
        dataIndex: 'total_revenue',
        key: 'total_revenue',
        render: formatCurrency,
        sorter: (a, b) => parseFloat(a.total_revenue) - parseFloat(b.total_revenue)
      },
      {
        title: 'Collected Amount',
        dataIndex: 'collected_amount',
        key: 'collected_amount',
        render: formatCurrency,
        sorter: (a, b) => parseFloat(a.collected_amount) - parseFloat(b.collected_amount)
      },
      {
        title: 'Unpaid Amount',
        dataIndex: 'unpaid_amount',
        key: 'unpaid_amount',
        render: formatCurrency,
        sorter: (a, b) => parseFloat(a.unpaid_amount) - parseFloat(b.unpaid_amount)
      },
      {
        title: 'Bookings',
        dataIndex: 'booking_count',
        key: 'booking_count',
        sorter: (a, b) => parseInt(a.booking_count) - parseInt(b.booking_count)
      },
    ];
  
    return baseColumns;
  };
  
  const getReservationColumns = () => {
    const baseColumns = [
      {
        title: reservationGroupBy === 'property' ? 'Property' :
              reservationGroupBy === 'status' ? 'Status' : 
              reservationGroupBy === 'payment_status' ? 'Payment Status' : 'Group',
        dataIndex: reservationGroupBy === 'property' ? 'propertyId' :
                 reservationGroupBy === 'status' ? 'status' :
                 reservationGroupBy === 'payment_status' ? 'payment_status' : 'propertyId',
        key: 'group',
        fixed: 'left',
        render: (text, record) => {
          if (reservationGroupBy === 'property') {
            return `Property ${text} `;
          }
          return text || 'N/A';
        }
      },
      {
        title: 'Total Bookings',
        dataIndex: 'total_bookings',
        key: 'total_bookings',
        sorter: (a, b) => parseInt(a.total_bookings) - parseInt(b.total_bookings)
      },
      {
        title: 'Completed',
        dataIndex: 'completed_bookings',
        key: 'completed_bookings',
        sorter: (a, b) => parseInt(a.completed_bookings) - parseInt(b.completed_bookings),
        render: (value) => value
      },
      {
        title: 'Checked In',
        dataIndex: 'checked_in_bookings',
        key: 'checked_in_bookings',
        sorter: (a, b) => parseInt(a.checked_in_bookings) - parseInt(b.checked_in_bookings)
      },
      {
        title: 'Pending',
        dataIndex: 'pending_bookings',
        key: 'pending_bookings',
        sorter: (a, b) => parseInt(a.pending_bookings) - parseInt(b.pending_bookings)
      },
      {
        title: 'Cancelled',
        dataIndex: 'cancelled_bookings',
        key: 'cancelled_bookings',
        sorter: (a, b) => parseInt(a.cancelled_bookings) - parseInt(b.cancelled_bookings)
      },
      {
        title: 'Potential Revenue',
        dataIndex: 'potential_revenue',
        key: 'potential_revenue',
        render: formatCurrency,
        sorter: (a, b) => parseFloat(a.potential_revenue) - parseFloat(b.potential_revenue)
      },
      {
        title: 'Actual Revenue',
        dataIndex: 'actual_revenue',
        key: 'actual_revenue',
        render: formatCurrency,
        sorter: (a, b) => parseFloat(a.actual_revenue) - parseFloat(b.actual_revenue)
      },
    ];

    return baseColumns;
  };

  const renderEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span>
          No data available. Please {dateRange && dateRange.length === 2 ? 'try a different date range' : 'select a date range'}.
        </span>
      }
    >
      {!dateRange || dateRange.length !== 2 ? (
        <Button type="primary" onClick={() => setDateRange([moment().subtract(30, 'days'), moment()])}>
          Set Last 30 Days
        </Button>
      ) : null}
    </Empty>
  );

  return (
    <div className="report-container" style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="content-area" style={{ marginLeft: 250,  width: 'calc(100% - 250px)' }}>
        <style>
          {`
            .pdf-export {
              background-color: white !important;
              padding: 20px !important;
            }
            .pdf-export table {
              width: 100% !important;
            }
            .no-export {
              visibility: visible;
            }
            .ant-table {
              border-radius: 4px;
              overflow: hidden;
            }
            .ant-table-thead > tr > th {
              background-color: #B6D0E2;
              color: #000000;
              font-weight: bold;
              padding: 12px 16px;
            }
            .ant-table-tbody > tr > td {
              padding: 12px 16px;
            }
            .ant-table-tbody > tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .ant-table-summary > tr > td {
              background-color: #B6D0E2;
              color: #000000;
              font-weight: bold;
              padding: 12px 16px;
            }
          `}
        </style>
        
        <Card 
          extra={
            <Space>
              <Button 
                type="primary" 
                onClick={() => exportToPDF(activeTab)}
                icon={<DownloadOutlined />}
                className="no-export"
              >
                Export PDF
              </Button>
              <Button 
                type="primary" 
                onClick={fetchData} 
                loading={loading}
                disabled={!dateRange || dateRange.length !== 2}
                className="no-export"
              >
                {loading ? 'Generating Report...' : 'Generate Report'}
              </Button>
            </Space>
          }
        >
          {error && (
            <Alert 
              message="Error" 
              description={error} 
              type="error" 
              showIcon 
              style={{ marginBottom: 16 }} 
              action={
                <Button size="small" onClick={fetchData}>
                  Retry
                </Button>
              }
            />
          )}
          
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: 300 }}
              allowClear={false}
              className="no-export"
            />
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Revenue Analysis" key="revenue">
              <div id="report-revenue">
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={24}>
                    <Card size="small" >
                      <Radio.Group 
                        value={revenueGroupBy} 
                        onChange={(e) => setRevenueGroupBy(e.target.value)}
                        buttonStyle="solid"
                      >
                        <Space wrap>
                          <Radio.Button value="day">Daily</Radio.Button>
                          <Radio.Button value="week">Weekly</Radio.Button>
                          <Radio.Button value="month">Monthly</Radio.Button>
                          <Radio.Button value="property">By Property</Radio.Button>
                        </Space>
                      </Radio.Group>
                    </Card>
                  </Col>
                </Row>
                
                <Row gutter={16} style={{ marginBottom: 20 }}>
                  <Col span={8}>
                    <Card>
                      <Statistic 
                        title="Total Revenue" 
                        value={revenueTotals.total_revenue} 
                        precision={2} 
                        prefix="$" 
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic 
                        title="Collected Amount" 
                        value={revenueTotals.collected_amount} 
                        precision={2} 
                        prefix="$"
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic 
                        title="Total Bookings" 
                        value={revenueTotals.booking_count}
                      />
                    </Card>
                  </Col>
                </Row>
                
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 10 }}>Loading report data...</p>
                  </div>
                ) : revenueData.length === 0 ? (
                  renderEmptyState()
                ) : (
                  <Table
                    columns={getRevenueColumns()}
                    dataSource={revenueData}
                    rowKey="key"
                    pagination={{ 
                      pageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50'],
                      showTotal: (total) => `Total ${total} items` 
                    }}
                    scroll={{ x: 'max-content' }}
                    summary={() => (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} align="right">
                            <strong>Totals</strong>
                          </Table.Summary.Cell>
                          {revenueGroupBy === 'payment_status' && (
                            <>
                              <Table.Summary.Cell index={1}>
                                <strong>{formatCurrency(revenueTotals.fully_paid_revenue)}</strong>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={2}>
                                <strong>{formatCurrency(revenueTotals.fully_paid_collected)}</strong>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={3}>
                                <strong>{formatCurrency(revenueTotals.deposit_paid_revenue)}</strong>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={4}>
                                <strong>{formatCurrency(revenueTotals.deposit_paid_collected)}</strong>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={5}>
                                <strong>{formatCurrency(revenueTotals.unpaid_revenue)}</strong>
                              </Table.Summary.Cell>
                            </>
                          )}
                          <Table.Summary.Cell index={revenueGroupBy === 'payment_status' ? 6 : 1}>
                            <strong>{formatCurrency(revenueTotals.total_revenue)}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={revenueGroupBy === 'payment_status' ? 7 : 2}>
                            <strong>{formatCurrency(revenueTotals.collected_amount)}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={revenueGroupBy === 'payment_status' ? 8 : 3}>
                            <strong>{formatCurrency(revenueTotals.unpaid_amount)}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={revenueGroupBy === 'payment_status' ? 9 : 4}>
                            <strong>{revenueTotals.booking_count}</strong>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                  />
                )}
              </div>
            </TabPane>
            
            <TabPane tab="Reservation Analysis" key="reservations">
              <div id="report-reservations">
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={24}>
                    <Card size="small" title="Group By">
                      <Radio.Group 
                        value={reservationGroupBy} 
                        onChange={(e) => setReservationGroupBy(e.target.value)}
                        buttonStyle="solid"
                      >
                        <Space wrap>
                          <Radio.Button value="property">By Property</Radio.Button>
                          <Radio.Button value="status">By Status</Radio.Button>
                          <Radio.Button value="payment_status">By Payment Status</Radio.Button>
                        </Space>
                      </Radio.Group>
                    </Card>
                  </Col>
                </Row>
                
                <Row gutter={16} style={{ marginBottom: 20 }}>
                  <Col span={6}>
                    <Card>
                      <Statistic 
                        title="Total Bookings" 
                        value={reservationTotals.total_bookings}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic 
                        title="Completed" 
                        value={reservationTotals.completed_bookings}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic 
                        title="Pending" 
                        value={reservationTotals.pending_bookings}
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic 
                        title="Cancelled" 
                        value={reservationTotals.cancelled_bookings}
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Card>
                  </Col>
                </Row>
                
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 10 }}>Loading reservation data...</p>
                  </div>
                ) : reservationData.length === 0 ? (
                  renderEmptyState()
                ) : (
                  <Table
                    columns={getReservationColumns()}
                    dataSource={reservationData}
                    rowKey="key"
                    pagination={{ 
                      pageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50'],
                      showTotal: (total) => `Total ${total} items` 
                    }}
                    scroll={{ x: 'max-content' }}
                    summary={() => (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} align="right">
                            <strong>Totals</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            <strong>{reservationTotals.total_bookings}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2}>
                            <strong>{reservationTotals.completed_bookings}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={3}>
                            <strong>{reservationTotals.checked_in_bookings}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={4}>
                            <strong>{reservationTotals.pending_bookings}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={5}>
                            <strong>{reservationTotals.cancelled_bookings}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={6}>
                            <strong>{formatCurrency(reservationTotals.potential_revenue)}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={7}>
                            <strong>{formatCurrency(reservationTotals.actual_revenue)}</strong>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                  />
                )}
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default RevenueReport;