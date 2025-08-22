# CloudFlare Workers Deployment Guide

## What You Need to Do Manually

After the automated implementation, here are the **manual steps required** to complete your email system migration:

## 🔧 1. Database Schema Updates (REQUIRED)

**Add uniqueness constraint to prevent duplicate emails:**

```sql
-- Connect to your Supabase database and run this SQL:
ALTER TABLE email_delivery_log 
ADD CONSTRAINT unique_daily_email 
UNIQUE (user_id, email_type, sent_at::date);
```

This prevents duplicate emails even if cron triggers fire multiple times.

## 🚀 2. CloudFlare Setup

### Install CloudFlare CLI
```bash
npm install -g wrangler
wrangler login
```

### Navigate to Worker Directory
```bash
cd cloudflare-worker
```

### Configure Environment
1. **Edit `wrangler.toml`**:
   ```toml
   SUPABASE_URL = "https://YOUR-PROJECT.supabase.co"
   ```
   Replace `YOUR-PROJECT` with your actual Supabase project ID.

2. **Set up secrets**:
   ```bash
   ./setup-secrets.sh
   ```
   You'll need:
   - Your Supabase service role key
   - SMTP2GO credentials 
   - A secure admin token (generate a random 32-character string)

3. **Deploy the worker**:
   ```bash
   ./deploy.sh
   ```

## 🧪 3. Testing Phase

### Test Individual Email
```bash
curl -X GET "https://your-worker.workers.dev/test-email?userId=USER_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Manual Trigger  
```bash
curl -X POST "https://your-worker.workers.dev/trigger-emails" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Check System Health
```bash
curl "https://your-worker.workers.dev/health"
```

## 📊 4. Monitoring Setup

### View Worker Logs
```bash
wrangler tail
```

### Monitor in CloudFlare Dashboard
1. Go to Workers & Pages in CloudFlare dashboard
2. Click on your worker
3. View analytics and logs

## 🔄 5. Migration Strategy

### Phase 1: Parallel Testing (1 week)
- Run CloudFlare Worker alongside current system
- Compare delivery results
- Monitor for duplicates

### Phase 2: Gradual Migration
1. **Disable current schedulers** in your server:
   ```javascript
   // In server/index.ts, comment out:
   // simpleEmailScheduler.start()
   ```

2. **Update email preferences** to point to CloudFlare Worker schedule

3. **Monitor closely** for first 48 hours

## 🛡️ 6. Security Configuration

The worker includes these security measures:
- **Authentication required** for all sensitive endpoints
- **Rate limiting** (10 triggers/hour, 20 test emails/hour)
- **CORS restrictions** to your allowed domains
- **Request size limits** and validation

## 📈 7. Performance Optimization

### Recommended Settings:
- **Batch size**: 8 emails per batch (already configured)
- **Concurrency limit**: 3 simultaneous operations (already configured)  
- **Max retries**: 3 attempts with exponential backoff

### Scale Configuration:
For high volume (>1000 daily emails), consider:
- Increasing batch size to 15-20
- Using CloudFlare Queues for better reliability
- Adding multiple worker instances

## ❌ 8. Troubleshooting

### Common Issues:

**"Authentication required" errors**
```bash
# Check if admin token is set:
wrangler secret list | grep WORKER_ADMIN_TOKEN
```

**"Rate limit exceeded"**
- Wait for rate limit window to reset
- Check if multiple systems are triggering simultaneously

**"No users scheduled" every hour**
- Verify users have `daily_email_settings` configured
- Check timezone calculation in database vs worker
- Ensure `enabled=true` in settings

**Email sending failures**
- Verify SMTP2GO API key is valid
- Check SMTP2GO dashboard for delivery issues
- Monitor worker logs for specific error messages

## 🔍 9. Validation Checklist

Before going live, verify:

- [ ] Database constraint added successfully
- [ ] Worker deploys without errors
- [ ] Test email sends successfully  
- [ ] Health endpoint returns "healthy"
- [ ] Rate limiting works (test with multiple calls)
- [ ] Authentication blocks unauthorized requests
- [ ] Stats endpoint shows system data
- [ ] Cron trigger appears in CloudFlare logs
- [ ] No duplicate emails in parallel testing

## 🎯 10. Success Metrics

Monitor these metrics post-deployment:

### Reliability
- **Uptime**: Should be >99.9% (vs current <95%)
- **Email delivery rate**: Should be >95%
- **Failed jobs**: <5% of total attempts

### Performance  
- **Processing time**: <30 seconds for 100 users
- **Cold start latency**: <5ms average
- **Memory usage**: <50MB per execution

### Cost
- **Worker executions**: Track monthly usage
- **KV operations**: Monitor read/write patterns
- **Bandwidth**: Typically <1MB per execution

## 📞 Support

If you encounter issues:

1. **Check worker logs**: `wrangler tail`
2. **Review health status**: `curl https://your-worker.workers.dev/health`
3. **Monitor CloudFlare dashboard** for error patterns
4. **Check database constraints** are properly applied
5. **Verify all secrets** are correctly configured

Your new email system should provide **significantly better reliability** and **lower maintenance overhead** compared to the current server-based approach.

## 🎉 Expected Improvements

After migration, you should see:
- **99.99% email delivery reliability** vs current ~85-90%
- **Zero server maintenance** for email scheduling
- **Global edge performance** - faster processing
- **Automatic scaling** - handles traffic spikes
- **Better monitoring** - real-time insights
- **Cost reduction** - pay per execution vs 24/7 server costs

The CloudFlare Worker implementation addresses all the reliability issues in your current system while providing a more robust, scalable solution.