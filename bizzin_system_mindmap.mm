<?xml version="1.0" encoding="UTF-8"?>
<map version="1.0.1">
<node COLOR="#000000" CREATED="1692000000000" ID="root" MODIFIED="1692000000000" TEXT="BIZZIN - Complete Business Intelligence Platform">
<edge COLOR="#808080" STYLE="bezier" WIDTH="thin"/>
<font NAME="SansSerif" SIZE="20"/>

<!-- CORE FOUNDATION -->
<node COLOR="#0033ff" CREATED="1692000000000" FOLDED="false" ID="foundation" MODIFIED="1692000000000" POSITION="right" TEXT="🏗️ CORE FOUNDATION">
<edge COLOR="#0033ff" STYLE="bezier" WIDTH="2"/>
<font NAME="SansSerif" SIZE="14"/>
<node COLOR="#000000" CREATED="1692000000000" ID="react" MODIFIED="1692000000000" TEXT="Frontend: React 18 + TypeScript + Vite">
<edge COLOR="#0033ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="supabase" MODIFIED="1692000000000" TEXT="Backend: Supabase (PostgreSQL + Auth + Storage)">
<edge COLOR="#0033ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="routing" MODIFIED="1692000000000" TEXT="Routing: Wouter">
<edge COLOR="#0033ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="ui" MODIFIED="1692000000000" TEXT="UI: shadcn/ui + Tailwind CSS">
<edge COLOR="#0033ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="state" MODIFIED="1692000000000" TEXT="State: TanStack React Query + React Context">
<edge COLOR="#0033ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="theme" MODIFIED="1692000000000" TEXT="Theme: Light/Dark mode support">
<edge COLOR="#0033ff" STYLE="bezier" WIDTH="1"/>
</node>
</node>

<!-- AUTHENTICATION -->
<node COLOR="#ff6600" CREATED="1692000000000" FOLDED="false" ID="auth" MODIFIED="1692000000000" POSITION="right" TEXT="🔐 AUTHENTICATION &amp; ACCESS CONTROL">
<edge COLOR="#ff6600" STYLE="bezier" WIDTH="2"/>
<font NAME="SansSerif" SIZE="14"/>
<node COLOR="#000000" CREATED="1692000000000" ID="supabase_auth" MODIFIED="1692000000000" TEXT="Supabase Auth (users table)">
<edge COLOR="#ff6600" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="user_profiles" MODIFIED="1692000000000" TEXT="User Profiles (extends auth.users)">
<edge COLOR="#ff6600" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="admin_users" MODIFIED="1692000000000" TEXT="Admin Users (role-based access)">
<edge COLOR="#ff6600" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="prelaunch" MODIFIED="1692000000000" TEXT="Pre-Launch Mode (controlled signups)">
<edge COLOR="#ff6600" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="protected_routes" MODIFIED="1692000000000" TEXT="Protected Routes (/dashboard, /profile, /admin)">
<edge COLOR="#ff6600" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="preview_routes" MODIFIED="1692000000000" TEXT="Preview Routes (feature previews)">
<edge COLOR="#ff6600" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="referral_system" MODIFIED="1692000000000" TEXT="Referral System (codes + rewards)">
<edge COLOR="#ff6600" STYLE="bezier" WIDTH="1"/>
</node>
</node>

<!-- USER JOURNEY -->
<node COLOR="#9900cc" CREATED="1692000000000" FOLDED="false" ID="user_journey" MODIFIED="1692000000000" POSITION="right" TEXT="📱 USER JOURNEY FLOW">
<edge COLOR="#9900cc" STYLE="bezier" WIDTH="2"/>
<font NAME="SansSerif" SIZE="14"/>
<node COLOR="#000000" CREATED="1692000000000" ID="landing" MODIFIED="1692000000000" TEXT="Landing (HomePage) → Features + CTA">
<edge COLOR="#9900cc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="auth_flow" MODIFIED="1692000000000" TEXT="Auth (AuthPage) → Sign In/Up + Referrals">
<edge COLOR="#9900cc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="prelaunch_flow" MODIFIED="1692000000000" TEXT="Pre-Launch (controlled by platform settings)">
<edge COLOR="#9900cc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="dashboard_flow" MODIFIED="1692000000000" TEXT="Dashboard (central hub for all features)">
<edge COLOR="#9900cc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="profile_flow" MODIFIED="1692000000000" TEXT="Profile (user settings + subscription)">
<edge COLOR="#9900cc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="admin_flow" MODIFIED="1692000000000" TEXT="Admin (platform management - admin only)">
<edge COLOR="#9900cc" STYLE="bezier" WIDTH="1"/>
</node>
</node>

<!-- CORE FEATURES -->
<node COLOR="#cc0000" CREATED="1692000000000" FOLDED="false" ID="features" MODIFIED="1692000000000" POSITION="left" TEXT="🎯 CORE FEATURES ECOSYSTEM">
<edge COLOR="#cc0000" STYLE="bezier" WIDTH="2"/>
<font NAME="SansSerif" SIZE="14"/>

<!-- DASHBOARD -->
<node COLOR="#004080" CREATED="1692000000000" FOLDED="false" ID="dashboard" MODIFIED="1692000000000" TEXT="1. DASHBOARD (Central Hub)">
<edge COLOR="#004080" STYLE="bezier" WIDTH="1"/>
<node COLOR="#000000" CREATED="1692000000000" ID="stats_cards" MODIFIED="1692000000000" TEXT="Statistical Overview Cards">
<edge COLOR="#004080" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="activity_feed" MODIFIED="1692000000000" TEXT="Recent Activity Feed">
<edge COLOR="#004080" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="quick_actions" MODIFIED="1692000000000" TEXT="Quick Actions (Create Goal, Write Entry)">
<edge COLOR="#004080" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="progress_summaries" MODIFIED="1692000000000" TEXT="Progress Summaries">
<edge COLOR="#004080" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="navigation_portal" MODIFIED="1692000000000" TEXT="Feature Navigation Portal">
<edge COLOR="#004080" STYLE="bezier" WIDTH="1"/>
</node>
</node>

<!-- GOALS SYSTEM -->
<node COLOR="#008000" CREATED="1692000000000" FOLDED="false" ID="goals" MODIFIED="1692000000000" TEXT="2. ADVANCED GOALS SYSTEM">
<edge COLOR="#008000" STYLE="bezier" WIDTH="1"/>
<node COLOR="#000000" CREATED="1692000000000" ID="goal_types" MODIFIED="1692000000000" TEXT="Goal Types: Manual vs Milestone-based">
<edge COLOR="#008000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#004000" CREATED="1692000000000" FOLDED="false" ID="milestone_mgmt" MODIFIED="1692000000000" TEXT="Milestone Management">
<edge COLOR="#008000" STYLE="bezier" WIDTH="1"/>
<node COLOR="#000000" CREATED="1692000000000" ID="crud_ops" MODIFIED="1692000000000" TEXT="CRUD Operations (inline editing)">
<edge COLOR="#004000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="weight_progress" MODIFIED="1692000000000" TEXT="Weight-based Progress (totals 100%)">
<edge COLOR="#004000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="visual_indicators" MODIFIED="1692000000000" TEXT="Visual Progress Indicators (colored dots)">
<edge COLOR="#004000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="realtime_validation" MODIFIED="1692000000000" TEXT="Real-time Validation">
<edge COLOR="#004000" STYLE="bezier" WIDTH="1"/>
</node>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="goal_conversion" MODIFIED="1692000000000" TEXT="Goal Conversion (bidirectional with data preservation)">
<edge COLOR="#008000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="categories" MODIFIED="1692000000000" TEXT="Categories: Growth, Marketing, Operations">
<edge COLOR="#008000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="priority_levels" MODIFIED="1692000000000" TEXT="Priority Levels: Low, Medium, High">
<edge COLOR="#008000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="status_tracking" MODIFIED="1692000000000" TEXT="Status Tracking: Not Started → In Progress → Completed">
<edge COLOR="#008000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="progress_calc" MODIFIED="1692000000000" TEXT="Progress Calculation (automatic from milestones)">
<edge COLOR="#008000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="analytics_insights" MODIFIED="1692000000000" TEXT="Analytics &amp; Insights">
<edge COLOR="#008000" STYLE="bezier" WIDTH="1"/>
</node>
</node>

<!-- JOURNAL SYSTEM -->
<node COLOR="#800080" CREATED="1692000000000" FOLDED="false" ID="journal" MODIFIED="1692000000000" TEXT="3. AI-POWERED JOURNAL">
<edge COLOR="#800080" STYLE="bezier" WIDTH="1"/>
<node COLOR="#000000" CREATED="1692000000000" ID="entry_mgmt" MODIFIED="1692000000000" TEXT="Entry Management (CRUD operations)">
<edge COLOR="#800080" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#400040" CREATED="1692000000000" FOLDED="false" ID="ai_sentiment" MODIFIED="1692000000000" TEXT="AI Sentiment Analysis">
<edge COLOR="#800080" STYLE="bezier" WIDTH="1"/>
<node COLOR="#000000" CREATED="1692000000000" ID="hf_primary" MODIFIED="1692000000000" TEXT="Primary: Hugging Face API">
<edge COLOR="#400040" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="ai_models" MODIFIED="1692000000000" TEXT="Models: cardiffnlp/twitter-roberta + emotion-english">
<edge COLOR="#400040" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="fallback" MODIFIED="1692000000000" TEXT="Fallback: Keyword analysis (quota protection)">
<edge COLOR="#400040" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="business_context" MODIFIED="1692000000000" TEXT="Business Context Insights">
<edge COLOR="#400040" STYLE="bezier" WIDTH="1"/>
</node>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="mood_tracking" MODIFIED="1692000000000" TEXT="Mood &amp; Energy Tracking">
<edge COLOR="#800080" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="search_filter" MODIFIED="1692000000000" TEXT="Search &amp; Filtering (by date, mood, tags)">
<edge COLOR="#800080" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="categorization" MODIFIED="1692000000000" TEXT="Categorization &amp; Tags">
<edge COLOR="#800080" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="favorites" MODIFIED="1692000000000" TEXT="Favorites System">
<edge COLOR="#800080" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="plan_limits" MODIFIED="1692000000000" TEXT="Plan-based Limits (free vs premium)">
<edge COLOR="#800080" STYLE="bezier" WIDTH="1"/>
</node>
</node>

<!-- TRAINING PLATFORM -->
<node COLOR="#ff8000" CREATED="1692000000000" FOLDED="false" ID="training" MODIFIED="1692000000000" TEXT="4. PODCAST/TRAINING SYSTEM">
<edge COLOR="#ff8000" STYLE="bezier" WIDTH="1"/>
<node COLOR="#000000" CREATED="1692000000000" ID="episode_mgmt" MODIFIED="1692000000000" TEXT="Episode Management">
<edge COLOR="#ff8000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="video_audio" MODIFIED="1692000000000" TEXT="Video + Audio Content">
<edge COLOR="#ff8000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="series_org" MODIFIED="1692000000000" TEXT="Series Organization">
<edge COLOR="#ff8000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="progress_tracking" MODIFIED="1692000000000" TEXT="Progress Tracking (watched/completed)">
<edge COLOR="#ff8000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="admin_upload" MODIFIED="1692000000000" TEXT="Admin Video Upload (Cloudflare R2)">
<edge COLOR="#ff8000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="learning_analytics" MODIFIED="1692000000000" TEXT="Learning Analytics">
<edge COLOR="#ff8000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="content_discovery" MODIFIED="1692000000000" TEXT="Content Discovery">
<edge COLOR="#ff8000" STYLE="bezier" WIDTH="1"/>
</node>
</node>

<!-- BIZBUILDER TOOLS -->
<node COLOR="#0080ff" CREATED="1692000000000" FOLDED="false" ID="bizbuilder" MODIFIED="1692000000000" TEXT="5. BIZBUILDER TOOLS">
<edge COLOR="#0080ff" STYLE="bezier" WIDTH="1"/>
<node COLOR="#000000" CREATED="1692000000000" ID="cashflow" MODIFIED="1692000000000" TEXT="Cash Flow Projection">
<edge COLOR="#0080ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="breakeven" MODIFIED="1692000000000" TEXT="Break-Even Analysis">
<edge COLOR="#0080ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="budget" MODIFIED="1692000000000" TEXT="Business Budget">
<edge COLOR="#0080ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="loan_amort" MODIFIED="1692000000000" TEXT="Loan Amortization">
<edge COLOR="#0080ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="calc_history" MODIFIED="1692000000000" TEXT="Calculation History">
<edge COLOR="#0080ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="scenario_saving" MODIFIED="1692000000000" TEXT="Scenario Saving">
<edge COLOR="#0080ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="export_import" MODIFIED="1692000000000" TEXT="Export/Import">
<edge COLOR="#0080ff" STYLE="bezier" WIDTH="1"/>
</node>
</node>

<!-- DOCSAFE SYSTEM -->
<node COLOR="#808000" CREATED="1692000000000" FOLDED="false" ID="docsafe" MODIFIED="1692000000000" TEXT="6. DOCSAFE SYSTEM">
<edge COLOR="#808000" STYLE="bezier" WIDTH="1"/>
<node COLOR="#000000" CREATED="1692000000000" ID="file_upload" MODIFIED="1692000000000" TEXT="Secure File Upload (Supabase Storage)">
<edge COLOR="#808000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="file_org" MODIFIED="1692000000000" TEXT="File Organization">
<edge COLOR="#808000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="access_control" MODIFIED="1692000000000" TEXT="Access Control">
<edge COLOR="#808000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="version_mgmt" MODIFIED="1692000000000" TEXT="Version Management">
<edge COLOR="#808000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="sharing" MODIFIED="1692000000000" TEXT="Sharing Capabilities">
<edge COLOR="#808000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="storage_quotas" MODIFIED="1692000000000" TEXT="Storage Quotas">
<edge COLOR="#808000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="file_types" MODIFIED="1692000000000" TEXT="File Type Restrictions">
<edge COLOR="#808000" STYLE="bezier" WIDTH="1"/>
</node>
</node>

<!-- ADMIN DASHBOARD -->
<node COLOR="#800000" CREATED="1692000000000" FOLDED="false" ID="admin_dashboard" MODIFIED="1692000000000" TEXT="7. ADMIN DASHBOARD">
<edge COLOR="#800000" STYLE="bezier" WIDTH="1"/>
<node COLOR="#000000" CREATED="1692000000000" ID="user_mgmt" MODIFIED="1692000000000" TEXT="User Management">
<edge COLOR="#800000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="admin_analytics" MODIFIED="1692000000000" TEXT="Analytics &amp; Insights">
<edge COLOR="#800000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="early_signups" MODIFIED="1692000000000" TEXT="Early Signups Management">
<edge COLOR="#800000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="content_mgmt" MODIFIED="1692000000000" TEXT="Content Management">
<edge COLOR="#800000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="system_health" MODIFIED="1692000000000" TEXT="System Health Monitoring">
<edge COLOR="#800000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="financial_overview" MODIFIED="1692000000000" TEXT="Financial Overview">
<edge COLOR="#800000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="video_upload" MODIFIED="1692000000000" TEXT="Video/Content Upload">
<edge COLOR="#800000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="prelaunch_toggle" MODIFIED="1692000000000" TEXT="Pre-Launch Toggle">
<edge COLOR="#800000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="platform_settings" MODIFIED="1692000000000" TEXT="Platform Settings">
<edge COLOR="#800000" STYLE="bezier" WIDTH="1"/>
</node>
</node>
</node>

<!-- DATABASE ARCHITECTURE -->
<node COLOR="#00cccc" CREATED="1692000000000" FOLDED="false" ID="database" MODIFIED="1692000000000" POSITION="left" TEXT="💾 DATABASE ARCHITECTURE">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="2"/>
<font NAME="SansSerif" SIZE="14"/>
<node COLOR="#000000" CREATED="1692000000000" ID="auth_users" MODIFIED="1692000000000" TEXT="auth.users (Supabase managed)">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="user_profiles_db" MODIFIED="1692000000000" TEXT="user_profiles (extends auth)">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="admin_users_db" MODIFIED="1692000000000" TEXT="admin_users (role control)">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="user_plans_db" MODIFIED="1692000000000" TEXT="user_plans (subscription data)">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="user_referrals_db" MODIFIED="1692000000000" TEXT="user_referrals (referral system)">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="early_signups_db" MODIFIED="1692000000000" TEXT="early_signups (pre-launch leads)">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="journal_entries_db" MODIFIED="1692000000000" TEXT="journal_entries (with AI analysis)">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="goals_db" MODIFIED="1692000000000" TEXT="goals (with progress tracking)">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="milestones_db" MODIFIED="1692000000000" TEXT="milestones (goal sub-components)">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="documents_db" MODIFIED="1692000000000" TEXT="documents (file metadata)">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="podcast_episodes_db" MODIFIED="1692000000000" TEXT="podcast_episodes (training content)">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="podcast_progress_db" MODIFIED="1692000000000" TEXT="user_podcast_progress (learning tracking)">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="calculator_history_db" MODIFIED="1692000000000" TEXT="calculator_history (saved calculations)">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="platform_settings_db" MODIFIED="1692000000000" TEXT="platform_settings (admin controls)">
<edge COLOR="#00cccc" STYLE="bezier" WIDTH="1"/>
</node>
</node>

<!-- SYSTEM INTEGRATIONS -->
<node COLOR="#ff00ff" CREATED="1692000000000" FOLDED="false" ID="integrations" MODIFIED="1692000000000" POSITION="left" TEXT="🔗 SYSTEM INTEGRATIONS">
<edge COLOR="#ff00ff" STYLE="bezier" WIDTH="2"/>
<font NAME="SansSerif" SIZE="14"/>
<node COLOR="#000000" CREATED="1692000000000" ID="supabase_integration" MODIFIED="1692000000000" TEXT="Supabase (database + auth + storage)">
<edge COLOR="#ff00ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="huggingface" MODIFIED="1692000000000" TEXT="Hugging Face API (AI sentiment analysis)">
<edge COLOR="#ff00ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="cloudflare_r2" MODIFIED="1692000000000" TEXT="Cloudflare R2 (video storage)">
<edge COLOR="#ff00ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="paystack" MODIFIED="1692000000000" TEXT="Paystack (subscription payments)">
<edge COLOR="#ff00ff" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="email_services" MODIFIED="1692000000000" TEXT="Email Services (notifications)">
<edge COLOR="#ff00ff" STYLE="bezier" WIDTH="1"/>
</node>
</node>

<!-- UI/UX ARCHITECTURE -->
<node COLOR="#004000" CREATED="1692000000000" FOLDED="false" ID="design" MODIFIED="1692000000000" POSITION="left" TEXT="🎨 UI/UX ARCHITECTURE">
<edge COLOR="#004000" STYLE="bezier" WIDTH="2"/>
<font NAME="SansSerif" SIZE="14"/>
<node COLOR="#000000" CREATED="1692000000000" ID="unified_cards" MODIFIED="1692000000000" TEXT="Unified Dashboard Cards (BaseStatsCard)">
<edge COLOR="#004000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="theme_system" MODIFIED="1692000000000" TEXT="Theme System (light/dark)">
<edge COLOR="#004000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="color_palette" MODIFIED="1692000000000" TEXT="Color Palette (orange primary)">
<edge COLOR="#004000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="typography" MODIFIED="1692000000000" TEXT="Consistent Typography">
<edge COLOR="#004000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="animations" MODIFIED="1692000000000" TEXT="Animation System (sequential reveals)">
<edge COLOR="#004000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="responsive" MODIFIED="1692000000000" TEXT="Responsive Design">
<edge COLOR="#004000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="accessibility" MODIFIED="1692000000000" TEXT="Accessibility Features">
<edge COLOR="#004000" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="progress_viz" MODIFIED="1692000000000" TEXT="Progress Visualizations">
<edge COLOR="#004000" STYLE="bezier" WIDTH="1"/>
</node>
</node>

<!-- KEY WORKFLOWS -->
<node COLOR="#666600" CREATED="1692000000000" FOLDED="false" ID="workflows" MODIFIED="1692000000000" POSITION="bottom" TEXT="🚀 KEY USER WORKFLOWS">
<edge COLOR="#666600" STYLE="bezier" WIDTH="2"/>
<font NAME="SansSerif" SIZE="14"/>

<!-- NEW USER JOURNEY -->
<node COLOR="#333300" CREATED="1692000000000" FOLDED="false" ID="new_user" MODIFIED="1692000000000" TEXT="New User Journey">
<edge COLOR="#666600" STYLE="bezier" WIDTH="1"/>
<node COLOR="#000000" CREATED="1692000000000" ID="land" MODIFIED="1692000000000" TEXT="1. Land → Homepage with feature preview">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="authenticate" MODIFIED="1692000000000" TEXT="2. Authenticate → Sign up/in (with referrals)">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="onboard" MODIFIED="1692000000000" TEXT="3. Onboard → Profile setup">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="explore" MODIFIED="1692000000000" TEXT="4. Explore → Dashboard overview">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="engage" MODIFIED="1692000000000" TEXT="5. Engage → Create first goal/journal entry">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
</node>

<!-- DAILY USER FLOW -->
<node COLOR="#333300" CREATED="1692000000000" FOLDED="false" ID="daily_user" MODIFIED="1692000000000" TEXT="Daily User Flow">
<edge COLOR="#666600" STYLE="bezier" WIDTH="1"/>
<node COLOR="#000000" CREATED="1692000000000" ID="check_dashboard" MODIFIED="1692000000000" TEXT="1. Dashboard → Check progress &amp; recent activity">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="write_journal" MODIFIED="1692000000000" TEXT="2. Journal → Write entry (AI analysis)">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="update_goals" MODIFIED="1692000000000" TEXT="3. Goals → Update milestone progress">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="learn_content" MODIFIED="1692000000000" TEXT="4. Learn → Watch training content">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="use_tools" MODIFIED="1692000000000" TEXT="5. Tools → Use business calculators">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
</node>

<!-- ADMIN MANAGEMENT -->
<node COLOR="#333300" CREATED="1692000000000" FOLDED="false" ID="admin_mgmt" MODIFIED="1692000000000" TEXT="Admin Management">
<edge COLOR="#666600" STYLE="bezier" WIDTH="1"/>
<node COLOR="#000000" CREATED="1692000000000" ID="monitor" MODIFIED="1692000000000" TEXT="1. Monitor → System health &amp; analytics">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="manage" MODIFIED="1692000000000" TEXT="2. Manage → Users &amp; content">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="configure" MODIFIED="1692000000000" TEXT="3. Configure → Platform settings">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="upload_content" MODIFIED="1692000000000" TEXT="4. Upload → Training videos">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="analyze" MODIFIED="1692000000000" TEXT="5. Analyze → Revenue &amp; engagement">
<edge COLOR="#333300" STYLE="bezier" WIDTH="1"/>
</node>
</node>
</node>

<!-- DATA FLOWS -->
<node COLOR="#800040" CREATED="1692000000000" FOLDED="false" ID="data_flows" MODIFIED="1692000000000" POSITION="bottom" TEXT="🔄 DATA FLOWS">
<edge COLOR="#800040" STYLE="bezier" WIDTH="2"/>
<font NAME="SansSerif" SIZE="14"/>
<node COLOR="#000000" CREATED="1692000000000" ID="goal_progress_flow" MODIFIED="1692000000000" TEXT="Goal Progress: Milestone completion → Progress calculation → Dashboard update → Analytics">
<edge COLOR="#800040" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="journal_ai_flow" MODIFIED="1692000000000" TEXT="Journal AI: Entry creation → Hugging Face API → Sentiment analysis → Insight generation → Display">
<edge COLOR="#800040" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="user_plans_flow" MODIFIED="1692000000000" TEXT="User Plans: Paystack webhook → Subscription update → Feature access control">
<edge COLOR="#800040" STYLE="bezier" WIDTH="1"/>
</node>
<node COLOR="#000000" CREATED="1692000000000" ID="admin_analytics_flow" MODIFIED="1692000000000" TEXT="Admin Analytics: All user activity → Data aggregation → Dashboard insights → Decision making">
<edge COLOR="#800040" STYLE="bezier" WIDTH="1"/>
</node>
</node>

</node>
</map>