                           ┌──────────────┐
                           │    Clinic    │
                           │   TENANT     │
                           └──────┬───────┘
                                  │
          ┌───────────────────────┼────────────────────────┐
          │                       │                        │
          ↓                       ↓                        ↓
   ClinicMember             WhatsAppAccount             Contact
          │                       │                        │
          ↓                       ↓                        ↓
        User                 Conversation             Appointment
                                  │                        │
                                  ↓                        ↓
                               Message                 Staff
                                  │
                                  ↓
                           MessageMedia


Clinic
 │
 ├── Services
 ├── WorkingHours
 ├── AvailabilityExceptions
 │
 ├── KnowledgeDocuments
 │        ↓
 │   KnowledgeChunks
 │        ↓
 │      Qdrant
 │
 ├── Workflows
 │      ↓
 │   WorkflowVersions
 │      ↓
 │   WorkflowRuns
 │
 ├── Campaigns
 │      ↓
 │   CampaignRecipients
 │
 ├── AgentRuns
 │      ↓
 │   ToolCalls
 │
 ├── HumanTasks
 │
 ├── WebhookEvents
 │
 └── AuditLogs