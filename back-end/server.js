// emailService.js
const nodemailer = require('nodemailer');
const Agenda = require('agenda');
const mongoConnectionString = 'mongodb://localhost/email-sequence';

// Initialize Agenda
const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'emailJobs' },
});

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Define email sending job
agenda.define('send email', async (job) => {
  const { to, subject, body } = job.attrs.data;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: body,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
});

// Start agenda
(async function() {
  await agenda.start();
})();

module.exports = agenda;

// routes/email.js
const express = require('express');
const router = express.Router();
const agenda = require('../emailService');

router.post('/schedule-email', async (req, res) => {
  try {
    const { to, subject, body, delay } = req.body;
    
    // Schedule email
    await agenda.schedule(
      `in ${delay} hours`,
      'send email',
      { to, subject, body }
    );
    
    res.json({ message: 'Email scheduled successfully' });
  } catch (error) {
    console.error('Error scheduling email:', error);
    res.status(500).json({ error: 'Failed to schedule email' });
  }
});

router.post('/save-flow', async (req, res) => {
  try {
    const { nodes, edges } = req.body;
    
    // Process the flow and schedule emails
    for (const node of nodes) {
      if (node.type === 'coldEmail') {
        // Find incoming edges to determine delay
        const incomingEdges = edges.filter(edge => edge.target === node.id);
        const sourceNode = nodes.find(n => n.id === incomingEdges[0]?.source);
        
        // Calculate total delay from previous delay nodes
        let totalDelay = 0;
        if (sourceNode && sourceNode.type === 'delay') {
          totalDelay += sourceNode.data.delay || 1;
        }
        
        // Schedule the email
        await agenda.schedule(
          `in ${totalDelay} hours`,
          'send email',
          {
            to: process.env.DEFAULT_EMAIL, // Replace with actual recipient
            subject: node.data.subject,
            body: node.data.body,
          }
        );
      }
    }
    
    res.json({ message: 'Flow saved and emails scheduled successfully' });
  } catch (error) {
    console.error('Error saving flow:', error);
    res.status(500).json({ error: 'Failed to save flow' });
  }
});

module.exports = router;