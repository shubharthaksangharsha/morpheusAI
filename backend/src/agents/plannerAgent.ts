import { BaseAgent } from './baseAgent';
import { AgentResponse, Message } from '../interfaces/agent.interface';

export interface TaskStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  dependencies: string[];
  estimatedDuration?: string;
  assignedTo?: string;
}

export interface Plan {
  id: string;
  title: string;
  description: string;
  steps: TaskStep[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
}

export class PlannerAgent extends BaseAgent {
  private plans: Map<string, Plan>;
  
  constructor() {
    const systemPrompt = `You are a Planning Agent for Morpheus AI.
Your role is to help users create structured plans and execution strategies.
- You should break down complex tasks into clear, actionable steps
- You should identify dependencies between steps
- You should provide time estimates when possible
- You should help users track progress and adapt plans as needed
- You should suggest optimizations and improvements to existing plans
- You should consider resource constraints and potential risks`;
    
    super('Planner Agent', 'Creates structured plans and execution strategies', systemPrompt);
    this.plans = new Map<string, Plan>();
  }
  
  async processMessage(message: string, history: Message[]): Promise<AgentResponse> {
    try {
      // Check for specific planning commands
      if (message.toLowerCase().startsWith('!plan create')) {
        return this.createPlan(message.substring(12).trim());
      }
      
      if (message.toLowerCase().startsWith('!plan update')) {
        const parts = message.substring(12).trim().split(' ');
        const planId = parts[0];
        const updateInfo = parts.slice(1).join(' ');
        return this.updatePlan(planId, updateInfo);
      }
      
      if (message.toLowerCase().startsWith('!plan list')) {
        return this.listPlans();
      }
      
      if (message.toLowerCase().startsWith('!plan details')) {
        const planId = message.substring(13).trim();
        return this.getPlanDetails(planId);
      }
      
      // Use Gemini to interpret the request
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName
      });
      
      // Create a chat session with system prompt
      const chat = model.startChat({
        history: [
          {
            role: 'system',
            parts: [{ text: this.systemPrompt }]
          }
        ]
      });

      // Add conversation history and the current message
      const processedHistory = this.formatMessagesForGemini([
        ...history,
        { role: 'user', content: message, timestamp: new Date() }
      ]);
      
      // Combine with planning context if available
      let prompt = message;
      if (this.plans.size > 0) {
        prompt += "\n\nExisting plans:\n";
        this.plans.forEach(plan => {
          prompt += `- ${plan.id}: ${plan.title} (${plan.status})\n`;
        });
      }
      
      // Send the message with context
      const result = await chat.sendMessage(prompt);
      const response = result.response.text();
      
      // Check if the response contains a plan structure and parse it
      const planMatch = response.match(/```plan\s+([\s\S]+?)```/);
      if (planMatch) {
        try {
          // Try to extract and create a structured plan
          return this.processPlanFromText(planMatch[1], response);
        } catch (error: any) {
          console.error('Error parsing plan structure:', error);
        }
      }
      
      return this.createResponse(response);
    } catch (error: any) {
      return this.createResponse(
        `I encountered an error processing your planning request: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  private async createPlan(request: string): Promise<AgentResponse> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName
      });
      
      const promptText = `Create a detailed plan for the following goal: "${request}"
      
Format the plan as a structured JSON object with the following properties:
- title: A concise title for the plan
- description: A detailed description of the plan's purpose and goals
- steps: An array of steps, each with:
  - id: A unique identifier for the step (e.g., "step1")
  - title: A brief title for the step
  - description: A detailed description of what needs to be done
  - dependencies: An array of step IDs that must be completed before this step can begin
  - estimatedDuration: Estimated time to complete this step (e.g., "2 hours", "3 days")

Provide a comprehensive and realistic plan.`;

      const result = await model.generateContent(promptText);
      const responseText = result.response.text();
      
      // Extract JSON from the response
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      let planData: any;
      
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[1]);
      } else {
        // If no JSON block is found, try parsing the entire response
        try {
          planData = JSON.parse(responseText);
        } catch (e) {
          return this.createResponse(
            `I couldn't create a structured plan. Here's what I came up with instead:\n\n${responseText}`,
            false,
            'Failed to parse plan JSON'
          );
        }
      }
      
      // Generate a plan ID and add additional metadata
      const planId = `plan-${Date.now().toString(36)}`;
      const now = new Date();
      
      const newPlan: Plan = {
        id: planId,
        title: planData.title,
        description: planData.description,
        steps: planData.steps.map((step: any) => ({
          ...step,
          status: 'pending'
        })),
        createdAt: now,
        updatedAt: now,
        status: 'draft'
      };
      
      // Store the plan
      this.plans.set(planId, newPlan);
      
      // Format the response
      let response = `📋 **Plan Created: ${newPlan.title}**\n\n`;
      response += `**ID:** ${planId}\n`;
      response += `**Description:** ${newPlan.description}\n\n`;
      response += `**Steps:**\n`;
      
      newPlan.steps.forEach(step => {
        response += `- **${step.title}** (${step.estimatedDuration || 'Unknown duration'})\n`;
        response += `  ${step.description}\n`;
        if (step.dependencies.length > 0) {
          response += `  Dependencies: ${step.dependencies.join(', ')}\n`;
        }
        response += `\n`;
      });
      
      response += `\nUse \`!plan details ${planId}\` to view this plan again, or \`!plan update ${planId}\` to modify it.`;
      
      return this.createResponse(response, true, undefined, { plan: newPlan });
    } catch (error: any) {
      return this.createResponse(
        `Error creating plan: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  private async updatePlan(planId: string, updateInfo: string): Promise<AgentResponse> {
    const plan = this.plans.get(planId);
    if (!plan) {
      return this.createResponse(
        `Plan with ID ${planId} not found. Use \`!plan list\` to see available plans.`,
        false,
        'Plan not found'
      );
    }
    
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName
      });
      
      const planJson = JSON.stringify(plan, null, 2);
      
      const promptText = `Here is an existing plan in JSON format:
      
\`\`\`json
${planJson}
\`\`\`

Update this plan based on the following request: "${updateInfo}"

Return the complete updated plan as a valid JSON object with the same structure. Maintain the same plan ID and creation date, but update the 'updatedAt' field to the current date. Make sure all steps have a status field.`;

      const result = await model.generateContent(promptText);
      const responseText = result.response.text();
      
      // Extract JSON from the response
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      let updatedPlanData: any;
      
      if (jsonMatch) {
        updatedPlanData = JSON.parse(jsonMatch[1]);
      } else {
        // If no JSON block is found, try parsing the entire response
        try {
          updatedPlanData = JSON.parse(responseText);
        } catch (e) {
          return this.createResponse(
            `I couldn't update the plan in a structured way. Here are the suggested changes:\n\n${responseText}`,
            false,
            'Failed to parse updated plan JSON'
          );
        }
      }
      
      // Ensure the ID remains the same
      updatedPlanData.id = planId;
      updatedPlanData.createdAt = plan.createdAt;
      updatedPlanData.updatedAt = new Date();
      
      // Update the plan in our store
      this.plans.set(planId, updatedPlanData as Plan);
      
      // Format the response
      let response = `📋 **Plan Updated: ${updatedPlanData.title}**\n\n`;
      response += `**ID:** ${planId}\n`;
      response += `**Description:** ${updatedPlanData.description}\n\n`;
      response += `**Steps:**\n`;
      
      (updatedPlanData.steps as TaskStep[]).forEach(step => {
        response += `- **${step.title}** (${step.status})\n`;
        response += `  ${step.description}\n`;
        if (step.dependencies.length > 0) {
          response += `  Dependencies: ${step.dependencies.join(', ')}\n`;
        }
        response += `\n`;
      });
      
      return this.createResponse(response, true, undefined, { plan: updatedPlanData });
    } catch (error: any) {
      return this.createResponse(
        `Error updating plan: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  private listPlans(): AgentResponse {
    if (this.plans.size === 0) {
      return this.createResponse(
        'No plans have been created yet. Use `!plan create [goal]` to create a new plan.',
        true
      );
    }
    
    let response = '📋 **Available Plans:**\n\n';
    
    this.plans.forEach(plan => {
      const completedSteps = plan.steps.filter(step => step.status === 'completed').length;
      const totalSteps = plan.steps.length;
      const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
      
      response += `**${plan.title}** (ID: ${plan.id})\n`;
      response += `Status: ${plan.status} | Progress: ${progress}% (${completedSteps}/${totalSteps} steps)\n`;
      response += `Created: ${plan.createdAt.toLocaleString()}\n\n`;
    });
    
    response += 'Use `!plan details [plan-id]` to view a specific plan.';
    
    return this.createResponse(response, true, undefined, { plans: Array.from(this.plans.values()) });
  }
  
  private getPlanDetails(planId: string): AgentResponse {
    const plan = this.plans.get(planId);
    if (!plan) {
      return this.createResponse(
        `Plan with ID ${planId} not found. Use \`!plan list\` to see available plans.`,
        false,
        'Plan not found'
      );
    }
    
    let response = `📋 **Plan: ${plan.title}**\n\n`;
    response += `**ID:** ${planId}\n`;
    response += `**Status:** ${plan.status}\n`;
    response += `**Created:** ${plan.createdAt.toLocaleString()}\n`;
    response += `**Updated:** ${plan.updatedAt.toLocaleString()}\n\n`;
    response += `**Description:** ${plan.description}\n\n`;
    response += `**Steps:**\n`;
    
    plan.steps.forEach(step => {
      const statusEmoji = step.status === 'completed' ? '✅' : 
                          step.status === 'in-progress' ? '🔄' :
                          step.status === 'blocked' ? '🚫' : '⏳';
      
      response += `${statusEmoji} **${step.title}** (${step.status})\n`;
      response += `  ${step.description}\n`;
      
      if (step.estimatedDuration) {
        response += `  Estimated Duration: ${step.estimatedDuration}\n`;
      }
      
      if (step.dependencies.length > 0) {
        response += `  Dependencies: ${step.dependencies.join(', ')}\n`;
      }
      
      response += `\n`;
    });
    
    response += `\nCommands:\n`;
    response += `- \`!plan update ${planId} [changes]\` - Update this plan\n`;
    response += `- \`!plan list\` - View all plans`;
    
    return this.createResponse(response, true, undefined, { plan });
  }
  
  private processPlanFromText(planText: string, fullResponse: string): AgentResponse {
    // Try to extract a structured plan from text format
    // This is a simple implementation that could be enhanced
    
    const lines = planText.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 3) {
      return this.createResponse(fullResponse);
    }
    
    // Extract title from the first line
    const title = lines[0].replace(/^#\s*/, '');
    
    // Extract description from lines until we hit a subheading
    let descriptionLines = [];
    let i = 1;
    while (i < lines.length && !lines[i].startsWith('#')) {
      descriptionLines.push(lines[i]);
      i++;
    }
    const description = descriptionLines.join(' ').trim();
    
    // Extract steps
    const steps: TaskStep[] = [];
    let currentStep: Partial<TaskStep> | null = null;
    
    for (; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('##')) {
        // Save previous step if exists
        if (currentStep && currentStep.title) {
          steps.push({
            id: `step${steps.length + 1}`,
            title: currentStep.title,
            description: currentStep.description || '',
            status: 'pending',
            dependencies: currentStep.dependencies || [],
            estimatedDuration: currentStep.estimatedDuration
          });
        }
        
        // Start new step
        currentStep = {
          title: line.replace(/^##\s*/, '')
        };
      } else if (currentStep) {
        // Add to current step description
        if (!currentStep.description) {
          currentStep.description = line;
        } else {
          currentStep.description += ' ' + line;
        }
        
        // Check for dependencies
        if (line.toLowerCase().includes('depend')) {
          const depMatch = line.match(/depends? on:?\s*(.+)/i);
          if (depMatch) {
            currentStep.dependencies = depMatch[1].split(',').map(d => d.trim());
          }
        }
        
        // Check for duration
        if (line.toLowerCase().includes('duration') || line.toLowerCase().includes('time')) {
          const timeMatch = line.match(/(?:duration|time):?\s*(.+)/i);
          if (timeMatch) {
            currentStep.estimatedDuration = timeMatch[1].trim();
          }
        }
      }
    }
    
    // Add the last step if exists
    if (currentStep && currentStep.title) {
      steps.push({
        id: `step${steps.length + 1}`,
        title: currentStep.title,
        description: currentStep.description || '',
        status: 'pending',
        dependencies: currentStep.dependencies || [],
        estimatedDuration: currentStep.estimatedDuration
      });
    }
    
    // Create and store the plan
    const planId = `plan-${Date.now().toString(36)}`;
    const now = new Date();
    
    const newPlan: Plan = {
      id: planId,
      title,
      description,
      steps,
      createdAt: now,
      updatedAt: now,
      status: 'draft'
    };
    
    this.plans.set(planId, newPlan);
    
    // Format response
    let response = `📋 **Plan Created: ${newPlan.title}**\n\n`;
    response += `**ID:** ${planId}\n`;
    response += `**Description:** ${newPlan.description}\n\n`;
    response += `**Steps:**\n`;
    
    newPlan.steps.forEach(step => {
      response += `- **${step.title}** (${step.estimatedDuration || 'Unknown duration'})\n`;
      response += `  ${step.description}\n`;
      if (step.dependencies.length > 0) {
        response += `  Dependencies: ${step.dependencies.join(', ')}\n`;
      }
      response += `\n`;
    });
    
    response += `\nUse \`!plan details ${planId}\` to view this plan again, or \`!plan update ${planId}\` to modify it.`;
    
    return this.createResponse(response, true, undefined, { plan: newPlan });
  }
} 