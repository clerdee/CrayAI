const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const ScanRecord = require('../models/ScanRecord');

// 1. GET ALL CONTENT (Posts & Comments) FOR MODERATION
exports.getModerationContent = async (req, res) => {
  try {
    const posts = await Post.find().populate('userId', 'firstName lastName profilePic email').sort({ createdAt: -1 }).lean();
    const comments = await Comment.find().populate('userId', 'firstName lastName profilePic email').sort({ createdAt: -1 }).lean();

    const formattedPosts = posts.map(p => ({
      id: p._id,
      type: 'Post',
      author: {
        name: p.userId ? `${p.userId.firstName} ${p.userId.lastName}` : 'Unknown',
        email: p.userId?.email || 'N/A',
        profilePic: p.userId?.profilePic || null 
      },
      content: p.content || (p.media?.length ? '[Media Content]' : '[Empty]'),
      reason: 'New Content',
      severity: 'Low',      
      timestamp: p.createdAt,
      status: p.moderationStatus || 'Pending',
      actionTaken: p.moderationStatus === 'Resolved' ? 'Approved' : null,
      media: p.media
    }));

    const formattedComments = comments.map(c => ({
      id: c._id,
      type: 'Comment',
      author: {
        name: c.userId ? `${c.userId.firstName} ${c.userId.lastName}` : 'Unknown',
        email: c.userId?.email || 'N/A',
        profilePic: c.userId?.profilePic || null
      },
      content: c.text,
      reason: 'New Comment',
      severity: 'Low',
      timestamp: c.createdAt,
      status: c.moderationStatus || 'Pending',
      actionTaken: c.moderationStatus === 'Resolved' ? 'Approved' : null
    }));

    const allContent = [...formattedPosts, ...formattedComments].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({ success: true, items: allContent });

  } catch (error) {
    console.error("Moderation Fetch Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 2. MODERATE CONTENT
exports.moderateContent = async (req, res) => {
  try {
    const { id, type } = req.params; 
    const { status } = req.body;

    const Model = type === 'Post' ? Post : Comment;
    
    if (status === 'Deleted') {
        await Model.findByIdAndDelete(id);
    } 
    else if (status === 'Approved') {
        await Model.findByIdAndUpdate(id, { moderationStatus: 'Resolved' });
    } else {
        return res.status(400).json({ message: "Invalid status action" });
    }

    res.status(200).json({ success: true, message: `${type} ${status} successfully` });
  } catch (error) {
    console.error("Moderation Action Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 3. REAL DASHBOARD ANALYTICS
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const allScans = await ScanRecord.find({ isDeleted: { $ne: true } })
        .populate('user', 'firstName lastName email');

    const totalScans = allScans.length; 

    // SCAN ACTIVITY (Last 7 Days)
    const activity = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0,0,0,0);
        const nextD = new Date(d);
        nextD.setDate(nextD.getDate() + 1);

        const dayScans = allScans.filter(s => s.createdAt >= d && s.createdAt < nextD);
        
        let diseaseCount = 0;
        dayScans.forEach(s => {
            if (s.environment?.algae_label === 'High' || s.environment?.algae_label === 'Critical' || s.environment?.turbidity_level > 6) {
                diseaseCount++;
            }
        });

        activity.push({
            // 🚨 UPDATED: Now includes month and day (e.g., 'Mon, Feb 19')
            name: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), 
            scans: dayScans.length,
            detected_disease: diseaseCount
        });
    }

    // POPULATION STATS
    let male = 0, female = 0, berried = 0, juvenile = 0;
    allScans.forEach(s => {
        if (s.gender === 'Male') male++;
        if (s.gender === 'Female') female++;
        if (s.gender === 'Berried') berried++;
        if (s.morphometrics?.estimated_age?.includes('Juvenile') || s.morphometrics?.estimated_age?.includes('Crayling')) juvenile++;
    });

    const population = [
        { name: 'Male', value: male, color: '#3B82F6' },
        { name: 'Female', value: female, color: '#EC4899' },
        { name: 'Berried', value: berried, color: '#F59E0B' },
        { name: 'Juvenile', value: juvenile, color: '#94A3B8' },
    ];

    // WATER QUALITY (Grouped by User + Location, Top 6 Most Active)
    const userPondStats = {};
    allScans.forEach(scan => {
        const loc = scan.location || 'Unknown Pond';
        const userName = scan.user ? `${scan.user.firstName} ${scan.user.lastName}` : 'Unknown';
        
        const key = `${userName.split(' ')[0]} (${loc})`; 
        
        if (!userPondStats[key]) userPondStats[key] = { turb: 0, alg: 0, count: 0 };
        
        userPondStats[key].turb += (scan.environment?.turbidity_level || 0);
        
        const alg = scan.environment?.algae_label;
        let algVal = 1; 
        if (alg === 'Moderate') algVal = 2;
        if (alg === 'High') algVal = 3;
        if (alg === 'Critical') algVal = 4;
        
        userPondStats[key].alg += algVal;
        userPondStats[key].count += 1;
    });

    const sortedKeys = Object.keys(userPondStats)
        .sort((a, b) => userPondStats[b].count - userPondStats[a].count)
        .slice(0, 6);

    const water = sortedKeys.map(key => ({ 
        name: key.length > 15 ? key.substring(0, 15) + '...' : key,
        turbidity: Number((userPondStats[key].turb / userPondStats[key].count).toFixed(1)),
        algae: Number((userPondStats[key].alg / userPondStats[key].count).toFixed(1))
    }));

    // RECENT LOGS (Top 5)
    const sortedScans = [...allScans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const logs = sortedScans.map(r => {
        const hasWarning = r.environment?.algae_label === 'High' || r.environment?.algae_label === 'Critical' || r.environment?.turbidity_level > 6;
        return {
            id: r.scanId || r._id,
            species: 'Australian Red Claw',
            user: r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Unknown User',
            email: r.user?.email || 'No email provided', 
            image: r.image?.url || null,
            health: hasWarning ? 'Warning' : 'Healthy',
            confidence: 95
        };
    });

    res.status(200).json({
      success: true,
      data: {
        scans: totalScans,
        activity,
        population,
        water,
        logs
      }
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 4. PROMOTE USER TO ADMIN
exports.promoteUser = async (req, res) => {
  try {
    const { id } = req.params; 

    const user = await User.findByIdAndUpdate(
      id, 
      { role: 'admin' }, 
      { new: true } 
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: `${user.firstName} has been promoted to Admin.`,
      user 
    });

  } catch (error) {
    console.error("Promote User Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};