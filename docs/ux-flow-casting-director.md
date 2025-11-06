# Greenlight Casting - Casting Director UX Flow

## Overview

This document outlines the complete user experience flow for a **Casting Director** using the Greenlight Casting application. The casting director is the primary user persona who manages casting projects, evaluates actors, and collaborates with team members to make casting decisions.

---

## Table of Contents

1. [Initial Entry & Onboarding](#initial-entry--onboarding)
2. [Project Management](#project-management)
3. [Character Management](#character-management)
4. [Actor Management](#actor-management)
5. [Workflow Stages (Tabs)](#workflow-stages-tabs)
6. [Evaluation & Voting](#evaluation--voting)
7. [Collaboration Features](#collaboration-features)
8. [Canvas Mode](#canvas-mode)
9. [Scheduling & Production](#scheduling--production)
10. [Settings & Customization](#settings--customization)

---

## 1. Initial Entry & Onboarding

### First Visit Experience

**Entry Point:** User opens the application for the first time

**Flow:**
1. **Splash Screen Modal** appears automatically
   - Displays welcome message and key features
   - Provides quick start guide
   - Options to:
     - Load demo data (pre-populated project with sample actors)
     - Start fresh
     - Access help wizard

2. **User Selection**
   - System defaults to first user (John Doe - Casting Director)
   - User can switch between available users:
     - John Doe (Casting Director)
     - Jane Smith (Producer)
     - Mike Johnson (Director)
   - Each user has distinct permissions and color coding

3. **Initial State**
   - Empty project state OR demo data loaded
   - Sidebar visible with navigation options
   - Main content area ready for project creation

**Key UI Elements:**
- Greenlight logo and branding (top-left)
- Notification bell (shows unread count)
- Sidebar collapse/expand toggle
- User avatar with status indicator

---

## 2. Project Management

### Creating a New Project

**Entry Point:** Click "Project: [Current Project]" button in sidebar

**Flow:**
1. **Project Manager Modal** opens
2. User can:
   - View all existing projects
   - Create new project:
     - Enter project name
     - Set project metadata
     - Configure terminology (Actor/Character labels)
   - Switch between projects
   - Edit project details
   - Delete projects

**Project Structure:**
- Each project contains:
  - Multiple characters (roles to be cast)
  - Project-specific terminology settings
  - Team members and permissions
  - Casting breakdown information
  - Schedule and production phases

### Switching Projects

**Flow:**
1. Click project selector in sidebar
2. Select from list of available projects
3. Application updates to show selected project's:
   - Characters
   - Actors
   - Current casting progress

---

## 3. Character Management

### Adding Characters

**Entry Point:** 
- Click "+" button in Characters Sidebar (right panel)
- Or: Upload characters via CSV

**Flow:**
1. **Add Character Modal** opens
2. User enters:
   - Character name (e.g., "Sarah Connor", "Lead Detective")
   - Character description
   - Age range
   - Gender
   - Special requirements
   - Notes

3. Character appears in Characters Sidebar
4. Automatically selected as current focus

### Character Details View

**Location:** Characters Sidebar (right panel)

**Features:**
- Character name and description
- Quick stats:
  - Total actors in consideration
  - Actors by stage (Long List, Audition, Approval)
  - Shortlist count
- Action buttons:
  - Edit character details
  - View character breakdown
  - Delete character

### Bulk Character Import

**Entry Point:** Upload Characters button

**Flow:**
1. **Upload Characters Modal** opens
2. User can:
   - Download CSV template
   - Upload CSV file with multiple characters
   - Map CSV columns to character fields
3. System validates and imports characters
4. Confirmation notification appears

---

## 4. Actor Management

### Adding Actors to Characters

**Entry Points:**
1. **Manual Entry:** Click "Add Actor" button in character view
2. **CSV Upload:** Bulk import actors for a character
3. **Form Submissions:** Actors submit via external form
4. **Database:** Browse and add from existing actor database

### Manual Actor Entry

**Flow:**
1. **Add Actor Modal** opens
2. User enters actor information:
   - **Basic Info:**
     - Name
     - Age / Playing Age
     - Gender
     - Location
   - **Contact:**
     - Email
     - Phone
     - Agent information
   - **Media:**
     - Headshots (multiple uploads)
     - Reels (video URLs)
     - Audition tapes
   - **Professional:**
     - IMDB URL
     - Skills/Special abilities
     - Previous work
   - **Casting Info:**
     - Status (Available, Busy, Unavailable)
     - Interest level
     - Notes

3. Actor is added to character's **Long List** by default
4. Success notification appears

### CSV Bulk Upload

**Flow:**
1. **Upload CSV Modal** opens
2. User:
   - Downloads template
   - Uploads populated CSV
   - Maps columns to actor fields
3. System processes and validates data
4. Actors imported to Long List
5. Summary notification shows import results

### Form Submissions

**Automatic Flow:**
1. Actor submits information via external form
2. System receives submission
3. **Notification** appears:
   - "New Form Submission Processed"
   - Shows actor name and character
   - Indicates media included (photos/videos)
4. Actor automatically added to Long List
5. Casting director can review and process

### Actor Database

**Entry Point:** Database button in sidebar

**Flow:**
1. **Database Modal** opens
2. User can:
   - Browse all actors across all projects
   - Search and filter actors
   - View actor details
   - Add actors to current character
   - Manage actor profiles globally

---

## 5. Workflow Stages (Tabs)

### Tab System Overview

The application uses a **tab-based workflow** to move actors through casting stages:

**Default Tabs:**
1. **Long List** - Initial consideration pool
2. **Audition** - Actors scheduled for auditions
3. **Approval** - Final candidates for approval

**Custom Tabs:**
- Users can create additional custom tabs
- Examples: "Callbacks", "Second Choices", "On Hold"

### Tab Navigation

**Location:** Below character header in main content area

**Features:**
- Horizontal tab bar with all stages
- Active tab highlighted
- Actor count badge on each tab
- Drag-and-drop to reorder custom tabs
- Right-click to rename/delete custom tabs

### Moving Actors Between Tabs

**Methods:**

1. **Drag and Drop:**
   - Drag actor card to different tab
   - Visual feedback during drag
   - Drop to move

2. **Context Menu:**
   - Right-click actor card
   - Select "Move to..."
   - Choose destination tab

3. **More Actions Menu:**
   - Click three-dot menu on actor card
   - Select "Move Actor"
   - **Move Actor Modal** opens with options:
     - Choose destination tab
     - Add move reason/notes
     - Confirm move

4. **Bulk Move:**
   - Select multiple actors (Ctrl/Cmd+Click)
   - Click "Move Selected" button
   - Choose destination tab

### Shortlists

**Special Tab Type:** Shortlists are sub-collections within a character

**Flow:**
1. Click "Shortlists" tab
2. View all shortlists for character
3. Create new shortlist:
   - **Add Shortlist Modal** opens
   - Enter shortlist name
   - Select actors to include
4. Shortlists display as separate groups
5. Actors can belong to multiple shortlists

---

## 6. Evaluation & Voting

### Viewing Actor Details

**Entry Point:** Click on actor card in any tab

**Actor Card Display:**
- Headshot (primary photo)
- Name and age
- Location
- Agent information
- Status indicators
- Skills/tags
- Quick action buttons
- Vote summary

### Card View Settings

**Location:** Sidebar > Card Display section

**Customizable Fields:**
- Age / Playing Age
- Location
- Agent
- IMDB URL
- Status
- Skills
- Notes
- Votes
- Action buttons
- Media & Notes

**User can toggle visibility** of each field to customize their view

### Player View (Full-Screen Review)

**Entry Point:** Click "Player View" button or press spacebar on actor card

**Features:**
1. **Full-screen modal** for focused review
2. **Navigation:**
   - Previous/Next actor buttons
   - Keyboard shortcuts (arrow keys)
   - Progress indicator
3. **Media Gallery:**
   - Multiple headshots with navigation
   - Video reels with playback controls
   - Audition tapes
   - Image zoom and pan
4. **Information Panel:**
   - Complete actor details
   - Notes and comments
   - Voting interface
   - Status management
5. **Quick Actions:**
   - Vote (Yes/No/Maybe)
   - Add notes
   - Change status
   - Move to different tab
   - Contact actor

### Voting System

**How It Works:**
1. Each team member can vote on actors
2. Vote options:
   - **Yes** (Green heart) - Approve
   - **No** (Red X) - Reject
   - **Maybe** (Blue star) - Undecided

3. **Vote Display:**
   - Vote summary shows all team votes
   - Color-coded by user
   - Consensus indicator
   - Vote count and percentages

4. **Voting in Player View:**
   - Large, prominent vote buttons
   - Immediate visual feedback
   - Auto-advance to next actor (optional)

5. **Voting on Canvas:**
   - Special "Voting View" mode
   - Collective voting for multiple actors
   - Quick comparison and decision-making

### Sorting and Filtering

**Sort Options:**
- Alphabetical (A-Z)
- Consensus (Most Voted)
- Status
- Date Added (Newest)
- Age (Youngest)
- Custom Order (manual drag-and-drop)

**Filter Options:**
- Status (Available, Busy, Unavailable)
- Age Range (slider)
- Location
- Tags/Skills
- Interest Level
- Contact Status

**Search:**
- Real-time search across actor names
- Search by tags
- Search by notes content

---

## 7. Collaboration Features

### Team Management

**Entry Point:** Sidebar > Permissions button

**User Permissions Modal:**
1. View all team members
2. Assign permission levels:
   - **Admin** - Full access to all features
   - **Editor** - Can edit actors and vote
   - **Viewer** - Can view and vote only

3. Manage user access:
   - Add new team members
   - Remove users
   - Change roles

### Team Suggestions

**Entry Point:** Sidebar > Team Suggestions button

**Features:**
- AI-powered casting suggestions
- Based on project requirements
- Considers team preferences
- Shows consensus recommendations

### Notifications System

**Entry Point:** Bell icon in sidebar (shows unread count)

**Notification Types:**
1. **System Notifications:**
   - Form submissions received
   - Actors moved between stages
   - Project updates
   - Cache cleared

2. **User Notifications:**
   - Team member votes
   - Comments added
   - Actors added/edited
   - Schedule changes

3. **Contact Notifications:**
   - Audition invites sent
   - Callback invites sent
   - Offers sent
   - Rejections sent

**Notification Management:**
- Mark individual as read
- Mark all as read
- Delete notifications
- Filter by type
- Priority indicators (high/medium/low)

### Casting Breakdown

**Entry Point:** Sidebar > Casting Breakdown button

**Features:**
- Overview of all characters
- Casting progress by character
- Actor counts per stage
- Export breakdown as PDF
- Share with team members

### Contact Actor

**Entry Point:** Actor card > Contact button

**Flow:**
1. **Contact Actor Modal** opens
2. Select contact type:
   - Audition Invite
   - Callback Invite
   - Offer
   - Rejection
   - General Contact

3. Compose message:
   - Pre-filled templates
   - Customize message
   - Add attachments
   - Schedule send time

4. Send notification
5. Status automatically updated on actor
6. Notification logged in system

---

## 8. Canvas Mode

### Overview

**Canvas Mode** is a visual workspace for creative casting exploration and group decision-making.

**Entry Point:** Click "Canvas" button (available in various locations)

### Canvas Features

**Layout:**
- Full-screen modal
- Infinite canvas with zoom and pan
- Drag-and-drop actor cards
- Visual grouping tools
- Sidebar with available actors

### Adding Actors to Canvas

**Methods:**
1. **Drag from Sidebar:**
   - Browse available actors
   - Drag actor card onto canvas
   - Position anywhere

2. **Search and Add:**
   - Search actors in sidebar
   - Drag filtered results

### Canvas Interactions

**Navigation:**
- **Pan:** Click and drag canvas background
- **Zoom:** Scroll wheel (cursor-centered)
- **Zoom Controls:** +/- buttons, fit to view, reset
- **Zoom to Selection:** Focus on selected actors

**Actor Cards:**
- **Move:** Drag individual cards
- **Select:** Click to select (Ctrl/Cmd for multiple)
- **Multi-select:** Checkbox on cards
- **Context Menu:** Right-click for options

### Grouping Actors

**Creating Groups:**
1. Select multiple actors (Ctrl/Cmd+Click)
2. Click "Group" button
3. **Create Group Modal:**
   - Enter group name
   - Choose color
   - Confirm

4. Group appears as colored boundary around actors
5. Group header shows name and actor count

**Group Features:**
- **Move Group:** Drag group header to move all actors
- **Edit Group:** Click group name to rename
- **Delete Group:** Remove grouping (actors remain)
- **Add to Group:** Drag actors into group boundary
- **Group Context Menu:** Right-click group for options

### Canvas View Modes

**Actor Card Views:**
1. **Standard** - Full details with photo
2. **Compact** - Reduced information
3. **Minimal** - Name and photo only
4. **Voting** - Optimized for voting sessions

### Collective Actions

**With Multiple Actors Selected:**
- **Collective Voting:**
  - Vote Yes/No/Maybe for all selected
  - Quick consensus building
  
- **Collective Move:**
  - Move all selected to same tab
  - Bulk stage progression

- **Group Transfer:**
  - Right-click group
  - Transfer entire group to tab
  - Maintains group relationships

### Saving Canvas Layouts

**Flow:**
1. Click "Save" button
2. Enter canvas title
3. Canvas saved with:
   - Actor positions
   - Groups
   - Zoom/pan state
   - View settings

4. **Load Saved Canvas:**
   - Sidebar shows saved canvases
   - Click to load
   - Delete unwanted canvases

### Canvas Chatbot

**AI Assistant Features:**
- Answers questions about actors on canvas
- Provides casting suggestions
- Analyzes group compositions
- Helps with decision-making

---

## 9. Scheduling & Production

### Schedule Management

**Entry Point:** Sidebar > Schedule button

**Schedule Modal Features:**
1. **Production Phases:**
   - Principal Photography
   - Rehearsals
   - Callbacks
   - Custom phases

2. **Schedule Entries:**
   - Audition dates
   - Callback sessions
   - Availability conflicts
   - Production dates

3. **Calendar View:**
   - Visual timeline
   - Actor availability
   - Conflict detection

### Booking Auditions

**Entry Point:** Actor card > Book Audition button

**Flow:**
1. **Book Audition Modal** opens
2. Select:
   - Date and time
   - Location
   - Audition type
   - Duration
   - Notes

3. System checks:
   - Actor availability
   - Schedule conflicts
   - Room availability

4. Confirmation sent to actor
5. Added to schedule
6. Notification created

---

## 10. Settings & Customization

### User Settings

**Entry Point:** Sidebar > Current User section

**User Menu Options:**
- Switch active user
- Rename user
- Change user color
- Update profile

### Card Display Settings

**Entry Point:** Sidebar > Card Display section

**Customization:**
- Toggle visibility of actor card fields
- Customize information density
- Show/hide action buttons
- Configure media display

### Terminology Customization

**Project-Level Settings:**
- Customize "Actor" label (e.g., "Performer", "Talent")
- Customize "Character" label (e.g., "Role", "Part")
- Applies to entire project
- Updates all UI references

### Tab Management

**Custom Tabs:**
1. Create new tabs for workflow stages
2. Rename existing tabs (front-end display only)
3. Reorder tabs (drag-and-drop)
4. Delete custom tabs
5. Reset to defaults

### Status Management

**Entry Point:** Sidebar > Manage Statuses (via context)

**Predefined Statuses:**
- **Availability:** Available, Busy, Unavailable
- **Interest:** Interested, Not Interested
- **Contact:** Audition Invite Sent, Callback Invite Sent, Offer Sent, Rejection Sent

**Custom Statuses:**
- Create project-specific statuses
- Assign colors
- Categorize by type

### Data Management

**Entry Point:** Sidebar > Data Tools section

**Options:**
1. **Clear Cache:**
   - Removes all local data
   - Resets to initial state
   - Shows splash screen on next load

2. **Load Demo Data:**
   - Populates with sample project
   - Includes actors and characters
   - Useful for testing and training

3. **Splash Screen:**
   - Manually open welcome screen
   - Access quick start guide

4. **Help & Support:**
   - Opens help wizard
   - Interactive tutorials
   - Feature explanations
   - Keyboard shortcuts

---

## Key User Flows Summary

### Quick Start Flow
1. Open app → Splash screen
2. Load demo data OR start fresh
3. Create project
4. Add characters
5. Add actors (manual, CSV, or form)
6. Review and vote
7. Move actors through stages
8. Make final casting decisions

### Daily Workflow
1. Check notifications
2. Review new form submissions
3. Evaluate actors in Player View
4. Vote and add notes
5. Move actors to next stage
6. Collaborate with team
7. Schedule auditions
8. Update statuses

### Decision-Making Flow
1. Open Canvas Mode
2. Add relevant actors
3. Create comparison groups
4. Use voting view
5. Discuss with team
6. Make collective decisions
7. Move actors to Approval
8. Send offers

---

## Keyboard Shortcuts

- **Spacebar** - Open Player View
- **Arrow Keys** - Navigate in Player View
- **Ctrl/Cmd + Click** - Multi-select actors
- **Escape** - Close modals
- **Ctrl/Cmd + F** - Focus search
- **Ctrl/Cmd + S** - Save canvas (in Canvas Mode)

---

## Best Practices for Casting Directors

1. **Start with Clear Characters:**
   - Define detailed character descriptions
   - Set specific requirements
   - Use character breakdown feature

2. **Organize Your Workflow:**
   - Use tabs to represent your casting stages
   - Create custom tabs for your process
   - Keep Long List broad, narrow as you progress

3. **Leverage Collaboration:**
   - Invite team members early
   - Use voting to build consensus
   - Review votes before moving actors

4. **Use Canvas for Big Decisions:**
   - Visual comparison of finalists
   - Group similar actors
   - Collective voting sessions

5. **Stay Organized:**
   - Add notes to actors
   - Update statuses regularly
   - Use tags for quick filtering

6. **Communicate Clearly:**
   - Use contact features for professional communication
   - Track all correspondence
   - Update actors on their status

7. **Save Your Work:**
   - Canvas layouts save automatically to localStorage
   - Use multiple saved canvases for different scenarios
   - Export casting breakdowns regularly

---

## Troubleshooting

**Issue:** Actors not appearing
- Check current character selection
- Verify correct tab is active
- Check filters and search terms

**Issue:** Can't move actors
- Verify user permissions
- Check if actor is in a locked state
- Try using Move Actor modal instead of drag-and-drop

**Issue:** Votes not showing
- Ensure "Show Votes" is enabled in Card Display settings
- Check that team members have voted
- Refresh the view

**Issue:** Canvas performance
- Reduce number of actors on canvas
- Use zoom to fit feature
- Close other modals and applications

---

## Support

For additional help:
- Click Help & Support in sidebar
- Open Help Wizard for interactive tutorials
- Check notification system for system messages
- Contact support at vercel.com/help

---

*Last Updated: January 2025*
*Version: 1.0*
