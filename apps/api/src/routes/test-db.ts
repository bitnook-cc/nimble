import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Test database connection
router.get('/test', async (req, res) => {
  try {
    // Try to create a test entry
    const testEntry = await prisma.testEntry.create({
      data: {
        message: `Test at ${new Date().toISOString()}`
      }
    });
    
    // Get all test entries
    const allEntries = await prisma.testEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    res.json({
      success: true,
      newEntry: testEntry,
      recentEntries: allEntries
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Clean up test entries
router.delete('/test', async (req, res) => {
  try {
    const deleted = await prisma.testEntry.deleteMany();
    res.json({ 
      success: true, 
      message: `Deleted ${deleted.count} test entries` 
    });
  } catch (error) {
    console.error('Failed to delete test entries:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete test entries' 
    });
  }
});

export default router;