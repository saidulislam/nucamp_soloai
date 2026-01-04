#!/usr/bin/env node

/**
 * Mautic Welcome Campaign Setup Script
 *
 * This script creates the welcome campaign components in Mautic:
 * 1. "New Authenticated Users" segment
 * 2. "Welcome to Lupin Learn" email template
 * 3. "Welcome Campaign" with automated triggers
 *
 * @see MA03-Mautic-Create-Campaign.md
 *
 * Usage: node scripts/setup-mautic-campaign.js
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configuration
const MAUTIC_BASEURL = process.env.MAUTIC_BASEURL || 'http://localhost:8080/api';
const MAUTIC_USERNAME = process.env.MAUTIC_USERNAME;
const MAUTIC_PASSWORD = process.env.MAUTIC_PASSWORD;
const APP_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';

if (!MAUTIC_USERNAME || !MAUTIC_PASSWORD) {
  console.error('Error: MAUTIC_USERNAME and MAUTIC_PASSWORD must be set in .env');
  process.exit(1);
}

// Create axios client with Basic Auth
const auth = Buffer.from(`${MAUTIC_USERNAME}:${MAUTIC_PASSWORD}`).toString('base64');
const client = axios.create({
  baseURL: MAUTIC_BASEURL,
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Welcome email HTML template
const welcomeEmailHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Lupin Learn</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">

    <!-- Main Container -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">

                <!-- Email Content Container -->
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                                Lupin Learn
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                                AI Tools to Save Time for Teachers
                            </p>
                        </td>
                    </tr>

                    <!-- Welcome Message -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                                Welcome, {contactfield=firstname}!
                            </h2>

                            <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                Thank you for joining Lupin Learn! We're excited to help you reclaim up to <strong>10 hours per week</strong> by automating repetitive teaching tasks.
                            </p>

                            <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                As a teacher, you have more important things to do than grade papers and create lesson plans from scratch. That's where we come in.
                            </p>
                        </td>
                    </tr>

                    <!-- Key Features -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <h3 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">
                                Get Started with These Popular AI Tools:
                            </h3>

                            <!-- Feature 1 -->
                            <div style="margin-bottom: 16px; padding: 16px; background-color: #f7fafc; border-radius: 6px; border-left: 4px solid #667eea;">
                                <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 16px; font-weight: 600;">
                                    Auto Grader
                                </h4>
                                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                                    Upload student submissions and receive scored evaluations with constructive feedback in minutes.
                                </p>
                            </div>

                            <!-- Feature 2 -->
                            <div style="margin-bottom: 16px; padding: 16px; background-color: #f7fafc; border-radius: 6px; border-left: 4px solid #667eea;">
                                <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 16px; font-weight: 600;">
                                    Lesson Producer
                                </h4>
                                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                                    Generate curriculum-aligned lesson plans with objectives, activities, and assessments instantly.
                                </p>
                            </div>

                            <!-- Feature 3 -->
                            <div style="margin-bottom: 16px; padding: 16px; background-color: #f7fafc; border-radius: 6px; border-left: 4px solid #667eea;">
                                <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 16px; font-weight: 600;">
                                    Student Chatbot
                                </h4>
                                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                                    Provide 24/7 AI-powered support to answer student questions and reduce repetitive inquiries.
                                </p>
                            </div>

                            <p style="margin: 20px 0 0 0; color: #718096; font-size: 14px; font-style: italic;">
                                Plus 37+ more AI tools to explore!
                            </p>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px; text-align: center;">
                            <a href="${APP_URL}/app/tools" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                                Explore AI Tools
                            </a>

                            <p style="margin: 16px 0 0 0; color: #718096; font-size: 14px;">
                                Or visit your <a href="${APP_URL}/account" style="color: #667eea; text-decoration: underline;">account dashboard</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Support Section -->
                    <tr>
                        <td style="padding: 30px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
                            <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 16px; font-weight: 600;">
                                Need Help Getting Started?
                            </h4>
                            <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                                We're here to help you make the most of Lupin Learn:
                            </p>
                            <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
                                <li><a href="${APP_URL}/docs" style="color: #667eea; text-decoration: underline;">Browse Documentation</a></li>
                                <li><a href="${APP_URL}/tutorials" style="color: #667eea; text-decoration: underline;">Watch Video Tutorials</a></li>
                                <li><a href="${APP_URL}/contact" style="color: #667eea; text-decoration: underline;">Contact Support</a></li>
                            </ul>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 12px 0; color: #718096; font-size: 14px;">
                                <strong>Lupin Learn</strong> - AI Tools to Save Time for Teachers
                            </p>
                            <p style="margin: 0 0 12px 0; color: #a0aec0; font-size: 12px;">
                                &copy; 2025 Lupin Learn. All rights reserved.
                            </p>
                            <p style="margin: 0; font-size: 12px;">
                                <a href="${APP_URL}/privacy" style="color: #a0aec0; text-decoration: underline;">Privacy Policy</a> &middot;
                                <a href="${APP_URL}/terms" style="color: #a0aec0; text-decoration: underline;">Terms of Service</a> &middot;
                                <a href="{unsubscribe_url}" style="color: #a0aec0; text-decoration: underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>`;

/**
 * Create the "New Authenticated Users" segment
 */
async function createSegment() {
  console.log('\n📋 Creating "New Authenticated Users" segment...');

  // First check if segment already exists
  try {
    const existingResponse = await client.get('/segments', {
      params: { search: 'New Authenticated Users' }
    });

    if (existingResponse.data.total && parseInt(existingResponse.data.total) > 0) {
      const existingId = Object.keys(existingResponse.data.lists)[0];
      console.log(`   ✅ Segment already exists with ID: ${existingId}`);
      return parseInt(existingId);
    }
  } catch (error) {
    // Segment doesn't exist, continue to create
  }

  const segmentData = {
    name: 'New Authenticated Users',
    alias: 'new-authenticated-users',
    description: 'Teachers who have registered and provided their full name and email',
    isPublished: true,
    isGlobal: false,
    filters: [
      {
        glue: 'and',
        field: 'firstname',
        object: 'lead',
        type: 'text',
        operator: '!empty',
        filter: null
      },
      {
        glue: 'and',
        field: 'lastname',
        object: 'lead',
        type: 'text',
        operator: '!empty',
        filter: null
      },
      {
        glue: 'and',
        field: 'email',
        object: 'lead',
        type: 'email',
        operator: '!empty',
        filter: null
      }
    ]
  };

  try {
    const response = await client.post('/segments/new', segmentData);
    const segmentId = response.data.list?.id;
    console.log(`   ✅ Segment created with ID: ${segmentId}`);
    return segmentId;
  } catch (error) {
    console.error('   ❌ Failed to create segment:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create the welcome email template
 */
async function createEmail() {
  console.log('\n📧 Creating "Welcome to Lupin Learn" email template...');

  // First check if email already exists
  try {
    const existingResponse = await client.get('/emails', {
      params: { search: 'Welcome to Lupin Learn' }
    });

    if (existingResponse.data.total && parseInt(existingResponse.data.total) > 0) {
      const existingId = Object.keys(existingResponse.data.emails)[0];
      console.log(`   ✅ Email already exists with ID: ${existingId}`);
      return parseInt(existingId);
    }
  } catch (error) {
    // Email doesn't exist, continue to create
  }

  const emailData = {
    name: 'Welcome to Lupin Learn - First Email',
    subject: 'Welcome to Lupin Learn, {contactfield=firstname}! Save 10 Hours Per Week',
    customHtml: welcomeEmailHtml,
    emailType: 'template',
    isPublished: true,
    language: 'en',
    fromName: 'Lupin Learn',
    fromAddress: 'hello@lupinlearn.com',
    replyToAddress: 'support@lupinlearn.com'
  };

  try {
    const response = await client.post('/emails/new', emailData);
    const emailId = response.data.email?.id;
    console.log(`   ✅ Email template created with ID: ${emailId}`);
    return emailId;
  } catch (error) {
    console.error('   ❌ Failed to create email:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create the welcome campaign
 */
async function createCampaign(segmentId, emailId) {
  console.log('\n🚀 Creating "Welcome Campaign" with automated triggers...');

  // First check if campaign already exists
  try {
    const existingResponse = await client.get('/campaigns', {
      params: { search: 'Welcome Campaign' }
    });

    if (existingResponse.data.total && parseInt(existingResponse.data.total) > 0) {
      const existingId = Object.keys(existingResponse.data.campaigns)[0];
      console.log(`   ✅ Campaign already exists with ID: ${existingId}`);
      return parseInt(existingId);
    }
  } catch (error) {
    // Campaign doesn't exist, continue to create
  }

  // Campaign structure with events
  const campaignData = {
    name: 'Welcome Campaign - New Authenticated Users',
    description: 'Automatically sends welcome email to teachers who complete registration with full profile',
    isPublished: true,
    allowRestart: false,
    events: [
      {
        id: 'new1',
        name: 'Contact joins segment',
        type: 'lead.changesegments',
        eventType: 'decision',
        order: 1,
        properties: {
          addedTo: [segmentId]
        },
        triggerMode: 'immediate',
        anchor: 'leadsource',
        anchorEventType: 'source'
      },
      {
        id: 'new2',
        name: 'Wait 5 minutes',
        type: 'delay',
        eventType: 'action',
        order: 2,
        properties: {
          triggerDelay: 5,
          triggerDelayUnit: 'i' // i = minutes
        },
        decisionPath: 'yes',
        parent: 'new1'
      },
      {
        id: 'new3',
        name: 'Send Welcome Email',
        type: 'email.send',
        eventType: 'action',
        order: 3,
        properties: {
          email: emailId
        },
        decisionPath: null,
        parent: 'new2'
      }
    ],
    lists: [segmentId],
    canvasSettings: {
      nodes: [
        {
          id: 'new1',
          positionX: 400,
          positionY: 100
        },
        {
          id: 'new2',
          positionX: 400,
          positionY: 250
        },
        {
          id: 'new3',
          positionX: 400,
          positionY: 400
        }
      ],
      connections: [
        { sourceId: 'new1', targetId: 'new2', anchors: { source: 'yes', target: 'top' } },
        { sourceId: 'new2', targetId: 'new3', anchors: { source: 'bottom', target: 'top' } }
      ]
    }
  };

  try {
    const response = await client.post('/campaigns/new', campaignData);
    const campaignId = response.data.campaign?.id;
    console.log(`   ✅ Campaign created with ID: ${campaignId}`);
    return campaignId;
  } catch (error) {
    console.error('   ❌ Failed to create campaign:', error.response?.data || error.message);

    // Try simpler campaign structure if complex one fails
    console.log('   🔄 Trying simplified campaign structure...');

    const simpleCampaignData = {
      name: 'Welcome Campaign - New Authenticated Users',
      description: 'Automatically sends welcome email to teachers who complete registration with full profile',
      isPublished: true,
      allowRestart: false,
      lists: [segmentId]
    };

    try {
      const simpleResponse = await client.post('/campaigns/new', simpleCampaignData);
      const campaignId = simpleResponse.data.campaign?.id;
      console.log(`   ✅ Basic campaign created with ID: ${campaignId}`);
      console.log('   ⚠️  Note: Campaign events need to be configured manually in Mautic UI');
      console.log('      Go to: Campaigns -> Welcome Campaign -> Launch Campaign Builder');
      console.log('      Add: Segment source -> Wait 5 min -> Send Email');
      return campaignId;
    } catch (simpleError) {
      console.error('   ❌ Failed to create simple campaign:', simpleError.response?.data || simpleError.message);
      throw simpleError;
    }
  }
}

/**
 * Verify the setup
 */
async function verifySetup(segmentId, emailId, campaignId) {
  console.log('\n🔍 Verifying setup...');

  try {
    // Check segment
    const segmentResponse = await client.get(`/segments/${segmentId}`);
    console.log(`   ✅ Segment verified: "${segmentResponse.data.list?.name}"`);

    // Check email
    const emailResponse = await client.get(`/emails/${emailId}`);
    console.log(`   ✅ Email verified: "${emailResponse.data.email?.name}"`);

    // Check campaign
    const campaignResponse = await client.get(`/campaigns/${campaignId}`);
    console.log(`   ✅ Campaign verified: "${campaignResponse.data.campaign?.name}"`);
    console.log(`      Published: ${campaignResponse.data.campaign?.isPublished ? 'Yes' : 'No'}`);

    return true;
  } catch (error) {
    console.error('   ❌ Verification failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('🎓 Mautic Welcome Campaign Setup Script');
  console.log('='.repeat(60));
  console.log(`\nMautic API: ${MAUTIC_BASEURL}`);
  console.log(`App URL: ${APP_URL}`);

  // Test connection first
  console.log('\n🔗 Testing Mautic API connection...');
  try {
    await client.get('/contacts?limit=1');
    console.log('   ✅ API connection successful');
  } catch (error) {
    console.error('   ❌ API connection failed:', error.response?.data || error.message);
    console.error('\n   Please ensure:');
    console.error('   1. Mautic is running at http://localhost:8080');
    console.error('   2. API is enabled in Mautic Configuration -> API Settings');
    console.error('   3. HTTP Basic Auth is enabled');
    console.error('   4. Credentials in .env are correct');
    process.exit(1);
  }

  try {
    // Step 1: Create segment
    const segmentId = await createSegment();

    // Step 2: Create email template
    const emailId = await createEmail();

    // Step 3: Create campaign
    const campaignId = await createCampaign(segmentId, emailId);

    // Step 4: Verify setup
    await verifySetup(segmentId, emailId, campaignId);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Welcome Campaign Setup Complete!');
    console.log('='.repeat(60));
    console.log('\nCreated resources:');
    console.log(`  • Segment ID: ${segmentId} - "New Authenticated Users"`);
    console.log(`  • Email ID: ${emailId} - "Welcome to Lupin Learn - First Email"`);
    console.log(`  • Campaign ID: ${campaignId} - "Welcome Campaign - New Authenticated Users"`);
    console.log('\nNext steps:');
    console.log('  1. Visit http://localhost:8080/s/campaigns to verify campaign');
    console.log('  2. Test by registering a new user via the app');
    console.log('  3. Check Mautic contacts and campaign statistics');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
