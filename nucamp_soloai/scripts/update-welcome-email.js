#!/usr/bin/env node

/**
 * Update Welcome Email Script (MA06-Create-First-Email.md)
 *
 * Updates the welcome email in Mautic with professional content
 * that meets all MA06 requirements:
 * - Dynamic personalization
 * - Brand consistency
 * - Mobile responsiveness
 * - CTA buttons
 * - Required unsubscribe link
 *
 * Usage: node scripts/update-welcome-email.js
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
const client = axios.create({
  baseURL: MAUTIC_BASEURL,
  auth: {
    username: MAUTIC_USERNAME,
    password: MAUTIC_PASSWORD
  },
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Professional welcome email HTML template (MA06 compliant)
const welcomeEmailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Welcome to Lupin Learn</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        /* Mobile styles */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            .mobile-padding {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }
            .mobile-stack {
                display: block !important;
                width: 100% !important;
            }
            .mobile-center {
                text-align: center !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

    <!-- Preheader text (hidden preview text) -->
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
        Welcome to Lupin Learn! Discover AI tools that save teachers 10+ hours per week.
    </div>

    <!-- Email wrapper -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f7;">
        <tr>
            <td align="center" style="padding: 40px 10px;">

                <!-- Email container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

                    <!-- Header with gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; text-align: center;" class="mobile-padding">
                            <!-- Logo placeholder - can be replaced with actual logo -->
                            <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 28px; color: #ffffff;">&#128218;</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                Lupin Learn
                            </h1>
                            <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 400;">
                                AI Tools to Save Time for Teachers
                            </p>
                        </td>
                    </tr>

                    <!-- Personalized Welcome Message -->
                    <tr>
                        <td style="padding: 50px 40px 30px 40px;" class="mobile-padding">
                            <h2 style="margin: 0 0 24px 0; color: #1a1a2e; font-size: 26px; font-weight: 600; line-height: 1.3;">
                                Welcome, {contactfield=firstname}!
                            </h2>

                            <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.7;">
                                Thank you for joining Lupin Learn! We're thrilled to have you as part of our community of educators who are transforming their teaching experience.
                            </p>

                            <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.7;">
                                Our AI-powered tools are designed to help you reclaim up to <strong style="color: #667eea;">10 hours per week</strong> by automating repetitive tasks like grading, lesson planning, and student communication.
                            </p>
                        </td>
                    </tr>

                    <!-- Value Proposition Box -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;" class="mobile-padding">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%); border-radius: 12px; border: 1px solid #e2e8f0;">
                                <tr>
                                    <td style="padding: 30px;">
                                        <h3 style="margin: 0 0 20px 0; color: #1a1a2e; font-size: 18px; font-weight: 600;">
                                            Get Started with These Popular AI Tools:
                                        </h3>

                                        <!-- Feature 1 -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
                                            <tr>
                                                <td width="40" valign="top">
                                                    <div style="width: 32px; height: 32px; background-color: #667eea; border-radius: 8px; text-align: center; line-height: 32px;">
                                                        <span style="color: #ffffff; font-size: 16px;">&#9998;</span>
                                                    </div>
                                                </td>
                                                <td style="padding-left: 12px;">
                                                    <h4 style="margin: 0 0 4px 0; color: #2d3748; font-size: 15px; font-weight: 600;">Auto Grader</h4>
                                                    <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">Upload submissions and receive scored evaluations with feedback in minutes.</p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Feature 2 -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
                                            <tr>
                                                <td width="40" valign="top">
                                                    <div style="width: 32px; height: 32px; background-color: #764ba2; border-radius: 8px; text-align: center; line-height: 32px;">
                                                        <span style="color: #ffffff; font-size: 16px;">&#128214;</span>
                                                    </div>
                                                </td>
                                                <td style="padding-left: 12px;">
                                                    <h4 style="margin: 0 0 4px 0; color: #2d3748; font-size: 15px; font-weight: 600;">Lesson Producer</h4>
                                                    <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">Generate curriculum-aligned lesson plans with objectives and activities instantly.</p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Feature 3 -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td width="40" valign="top">
                                                    <div style="width: 32px; height: 32px; background-color: #48bb78; border-radius: 8px; text-align: center; line-height: 32px;">
                                                        <span style="color: #ffffff; font-size: 16px;">&#128172;</span>
                                                    </div>
                                                </td>
                                                <td style="padding-left: 12px;">
                                                    <h4 style="margin: 0 0 4px 0; color: #2d3748; font-size: 15px; font-weight: 600;">Student Chatbot</h4>
                                                    <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">Provide 24/7 AI-powered support to answer student questions.</p>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="margin: 20px 0 0 0; color: #718096; font-size: 14px; font-style: italic; text-align: center;">
                                            Plus 37+ more AI tools to explore!
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Primary CTA -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px; text-align: center;" class="mobile-padding">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                        <a href="${APP_URL}/account" style="display: inline-block; padding: 18px 40px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                                            Explore Your Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0 0 0; color: #718096; font-size: 14px;">
                                Or <a href="${APP_URL}/features" style="color: #667eea; text-decoration: underline; font-weight: 500;">browse all AI tools</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Next Steps Section -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;" class="mobile-padding">
                            <h3 style="margin: 0 0 16px 0; color: #1a1a2e; font-size: 18px; font-weight: 600;">
                                Your Next Steps:
                            </h3>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td width="30" style="color: #667eea; font-weight: 600; font-size: 16px;">1.</td>
                                                <td style="color: #4a5568; font-size: 15px;"><a href="${APP_URL}/account" style="color: #4a5568; text-decoration: none;">Complete your profile settings</a></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td width="30" style="color: #667eea; font-weight: 600; font-size: 16px;">2.</td>
                                                <td style="color: #4a5568; font-size: 15px;"><a href="${APP_URL}/features" style="color: #4a5568; text-decoration: none;">Explore our AI tool library</a></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td width="30" style="color: #667eea; font-weight: 600; font-size: 16px;">3.</td>
                                                <td style="color: #4a5568; font-size: 15px;"><a href="${APP_URL}/pricing" style="color: #4a5568; text-decoration: none;">Choose the plan that fits your needs</a></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Support Section -->
                    <tr>
                        <td style="padding: 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;" class="mobile-padding">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center;">
                                        <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 16px; font-weight: 600;">
                                            Need Help Getting Started?
                                        </h4>
                                        <p style="margin: 0 0 20px 0; color: #718096; font-size: 14px; line-height: 1.6;">
                                            Our support team is here to help you make the most of Lupin Learn.
                                        </p>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 10px;">
                                                    <a href="${APP_URL}/contact" style="color: #667eea; font-size: 14px; text-decoration: underline;">Contact Support</a>
                                                </td>
                                                <td style="color: #cbd5e0;">|</td>
                                                <td style="padding: 0 10px;">
                                                    <a href="${APP_URL}/features" style="color: #667eea; font-size: 14px; text-decoration: underline;">Browse Features</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;" class="mobile-padding">
                            <p style="margin: 0 0 12px 0; color: #1a1a2e; font-size: 14px; font-weight: 600;">
                                Lupin Learn
                            </p>
                            <p style="margin: 0 0 16px 0; color: #a0aec0; font-size: 12px; line-height: 1.6;">
                                AI Tools to Save Time for Teachers<br>
                                &copy; 2025 Lupin Learn. All rights reserved.
                            </p>
                            <p style="margin: 0; font-size: 12px;">
                                <a href="${APP_URL}/privacy" style="color: #a0aec0; text-decoration: underline;">Privacy Policy</a>
                                &nbsp;&middot;&nbsp;
                                <a href="${APP_URL}/terms" style="color: #a0aec0; text-decoration: underline;">Terms of Service</a>
                                &nbsp;&middot;&nbsp;
                                <a href="{unsubscribe_url}" style="color: #a0aec0; text-decoration: underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>

                </table>
                <!-- End email container -->

            </td>
        </tr>
    </table>
    <!-- End email wrapper -->

</body>
</html>`;

/**
 * Update the welcome email template
 */
async function updateWelcomeEmail() {
  console.log('='.repeat(60));
  console.log('Updating Welcome Email Template (MA06)');
  console.log('='.repeat(60));
  console.log(`\nMautic API: ${MAUTIC_BASEURL}`);
  console.log(`App URL: ${APP_URL}`);

  // Test connection first
  console.log('\nTesting Mautic API connection...');
  try {
    await client.get('/contacts?limit=1');
    console.log('   API connection successful');
  } catch (error) {
    console.error('   API connection failed:', error.response?.data || error.message);
    process.exit(1);
  }

  // Update email ID 1
  const emailId = 1;
  console.log(`\nUpdating email ID ${emailId}...`);

  const emailData = {
    name: 'Welcome to Lupin Learn - First Email',
    subject: 'Welcome to Lupin Learn, {contactfield=firstname}! Your AI Teaching Assistant Awaits',
    customHtml: welcomeEmailHtml,
    emailType: 'template',
    isPublished: true,
    language: 'en',
    fromName: 'Lupin Learn',
    fromAddress: 'hello@lupinlearn.com',
    replyToAddress: 'support@lupinlearn.com',
    preheaderText: 'Discover AI tools that save teachers 10+ hours per week'
  };

  try {
    const response = await client.patch(`/emails/${emailId}/edit`, emailData);
    const email = response.data.email;

    console.log('\n' + '='.repeat(60));
    console.log('Welcome Email Updated Successfully!');
    console.log('='.repeat(60));
    console.log(`\nEmail Details:`);
    console.log(`  ID: ${email.id}`);
    console.log(`  Name: ${email.name}`);
    console.log(`  Subject: ${email.subject}`);
    console.log(`  Published: ${email.isPublished}`);
    console.log(`  From: ${email.fromName} <${email.fromAddress}>`);
    console.log(`  Preheader: ${email.preheaderText || 'Not set'}`);

    console.log('\nMA06 Requirements Satisfied:');
    console.log('  [x] Professional email template with WYSIWYG-compatible HTML');
    console.log('  [x] Dynamic content with {contactfield=firstname} personalization');
    console.log('  [x] Brand consistency (Lupin Learn colors, typography)');
    console.log('  [x] Clear primary CTA (Explore Your Dashboard)');
    console.log('  [x] Mobile responsive design with @media queries');
    console.log('  [x] Value proposition (10 hours/week, 40+ AI tools)');
    console.log('  [x] Feature highlights (Auto Grader, Lesson Producer, Chatbot)');
    console.log('  [x] Next steps guidance (numbered list)');
    console.log('  [x] Support information and contact links');
    console.log('  [x] Footer with Privacy Policy, Terms, Unsubscribe');
    console.log('  [x] Preheader text for email preview');

    console.log('\nNext steps:');
    console.log('  1. Visit http://localhost:8080/s/emails to preview');
    console.log('  2. Send a test email to verify rendering');
    console.log('  3. Test with new user registration');
    console.log('\n');

    return email;
  } catch (error) {
    console.error('Failed to update email:', error.response?.data || error.message);
    throw error;
  }
}

updateWelcomeEmail().catch(console.error);
