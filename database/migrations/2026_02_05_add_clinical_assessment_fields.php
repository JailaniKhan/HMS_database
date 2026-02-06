<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds clinical assessment fields for symptom validation and fabrication detection
     */
    public function up(): void
    {
        // Add assessment fields to medical_records table
        Schema::table('medical_records', function (Blueprint $table) {
            // Symptom Assessment Fields
            $table->text('symptom_duration')->nullable()->after('present_illness');
            $table->text('symptom_pattern')->nullable()->after('symptom_duration');
            $table->text('symptom_severity')->nullable()->after('symptom_pattern');
            $table->text('symptom_location')->nullable()->after('symptom_severity');
            $table->text('symptom_quality')->nullable()->after('symptom_location');
            $table->text('symptom_aggravating_factors')->nullable()->after('symptom_quality');
            $table->text('symptom_alleviating_factors')->nullable()->after('symptom_aggravating_factors');
            
            // Behavioral Assessment Fields
            $table->text('behavioral_observations')->nullable()->after('physical_examination');
            $table->text('patient_cooperation_level')->nullable()->after('behavioral_observations');
            $table->text('narrative_coherence_notes')->nullable()->after('patient_cooperation_level');
            
            // Consistency Assessment Fields
            $table->boolean('symptoms_consistent_with_history')->nullable()->after('narrative_coherence_notes');
            $table->boolean('symptoms_consistent_with_exam')->nullable()->after('symptoms_consistent_with_history');
            $table->text('consistency_notes')->nullable()->after('symptoms_consistent_with_exam');
            
            // Secondary Gain Assessment
            $table->boolean('secondary_gain_indicators_present')->nullable()->after('consistency_notes');
            $table->text('secondary_gain_notes')->nullable()->after('secondary_gain_indicators_present');
            
            // Clinical Validation Fields
            $table->string('clinical_validation_status')->nullable()->after('secondary_gain_notes');
            $table->text('validation_notes')->nullable()->after('clinical_validation_status');
            $table->unsignedBigInteger('validated_by')->nullable()->after('validation_notes');
            $table->timestamp('validated_at')->nullable()->after('validated_by');
            
            // Add index for clinical validation queries
            $table->index('clinical_validation_status', 'idx_clinical_validation');
        });

        // Create clinical_assessments table for detailed evaluations
        Schema::create('clinical_assessments', function (Blueprint $table) {
            $table->id();
            $table->string('assessment_number')->unique();
            $table->unsignedBigInteger('medical_record_id');
            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('assessor_id'); // Doctor who performed assessment
            
            // Assessment Type
            $table->string('assessment_type'); // initial, follow-up, fabrication_screening, comprehensive
            
            // Symptom Validity Assessment
            $table->text('symptom_validity_findings')->nullable();
            $table->integer('symptom_validity_score')->nullable(); // 0-100
            $table->string('symptom_validity_rating')->nullable(); // consistent, inconsistent, indeterminate
            
            // Behavioral Observations
            $table->text('general_appearance')->nullable();
            $table->text('interaction_style')->nullable();
            $table->text('affect_and_mood')->nullable();
            $table->text('cognitive_presentation')->nullable();
            $table->text('pain_behavior_observations')->nullable();
            
            // Consistency Analysis
            $table->text('historical_consistency_analysis')->nullable();
            $table->text('cross_visit_pattern_analysis')->nullable();
            $table->text('symptom_exaggeration_indicators')->nullable();
            $table->text('symptom_minimization_indicators')->nullable();
            
            // Secondary Gain Factors
            $table->boolean('financial_incentives_present')->nullable();
            $table->boolean('medication_seeking_present')->nullable();
            $table->boolean('responsibility_avoidance_present')->nullable();
            $table->boolean('attention_seeking_present')->nullable();
            $table->boolean('legal_compensation_present')->nullable();
            $table->text('secondary_gain_analysis')->nullable();
            
            // Collateral Information
            $table->text('collateral_history_notes')->nullable();
            $table->text('prior_medical_records_review')->nullable();
            $table->text('family_report_notes')->nullable();
            
            // Diagnostic Impressions
            $table->text('primary_diagnosis_impression')->nullable();
            $table->text('differential_diagnosis')->nullable();
            $table->text('assessment_limitations')->nullable();
            
            // Recommendations
            $table->text('further_evaluation_recommended')->nullable();
            $table->text('treatment_recommendations')->nullable();
            $table->text('follow_up_plan')->nullable();
            
            // Overall Assessment
            $table->string('overall_reliability_rating')->nullable(); // reliable, moderately_reliable, unreliable
            $table->string('fabrication_suspicion_level')->nullable(); // none, low, moderate, high
            $table->text('assessment_summary')->nullable();
            
            // Status and Timestamps
            $table->enum('status', ['draft', 'finalized', 'amended', 'disputed'])->default('draft');
            $table->timestamps();
            
            // Indexes
            $table->index(['patient_id', 'created_at'], 'idx_assessment_patient_date');
            $table->index(['assessor_id', 'created_at'], 'idx_assessment_assessor_date');
            $table->index('assessment_type');
            $table->index('fabrication_suspicion_level');
            
            // Ensure consistent charset and collation to prevent foreign key constraint issues
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';
        });

        // Add foreign key constraints after table creation (deferred due to MySQL constraint issues)
        Schema::table('clinical_assessments', function (Blueprint $table) {
            $table->foreign('medical_record_id')->references('id')->on('medical_records')->onDelete('cascade');
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            // Temporarily skipping the assessor_id foreign key constraint due to MySQL constraint issues
            // Will be added in a follow-up migration
        });

        // Create assessment_consistency_logs table for tracking changes
        Schema::create('assessment_consistency_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('clinical_assessment_id');
            $table->unsignedBigInteger('patient_id');
            $table->string('consistency_check_type'); // symptom_pattern, vital_signs, diagnosis
            $table->text('previous_value')->nullable();
            $table->text('current_value')->nullable();
            $table->text('analysis_notes')->nullable();
            $table->unsignedBigInteger('logged_by')->nullable(); // Required for ON DELETE SET NULL foreign key
            $table->timestamps();
            
            // Indexes
            $table->index(['clinical_assessment_id', 'created_at'], 'idx_consistency_log_assessment_date');
            $table->index(['patient_id', 'created_at'], 'idx_consistency_log_patient_date');
            $table->index('logged_by', 'assessment_consistency_logs_logged_by_index');
            
            // Ensure consistent charset and collation to prevent foreign key constraint issues
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';
        });

        // Add foreign key constraints after table creation
        Schema::table('assessment_consistency_logs', function (Blueprint $table) {
            $table->foreign('clinical_assessment_id')->references('id')->on('clinical_assessments')->onDelete('cascade');
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('logged_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_consistency_logs');
        Schema::dropIfExists('clinical_assessments');
        
        Schema::table('medical_records', function (Blueprint $table) {
            $columnsToRemove = [
                'symptom_duration',
                'symptom_pattern',
                'symptom_severity',
                'symptom_location',
                'symptom_quality',
                'symptom_aggravating_factors',
                'symptom_alleviating_factors',
                'behavioral_observations',
                'patient_cooperation_level',
                'narrative_coherence_notes',
                'symptoms_consistent_with_history',
                'symptoms_consistent_with_exam',
                'consistency_notes',
                'secondary_gain_indicators_present',
                'secondary_gain_notes',
                'clinical_validation_status',
                'validation_notes',
                'validated_by',
                'validated_at',
            ];
            
            foreach ($columnsToRemove as $column) {
                if (Schema::hasColumn('medical_records', $column)) {
                    $table->dropColumn($column);
                }
            }
            
            $table->dropIndex('idx_clinical_validation');
        });
    }
};
