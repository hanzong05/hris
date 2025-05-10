<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('trainings', function (Blueprint $table) {
            // First check if the old 'trainer' column exists and drop it
            if (Schema::hasColumn('trainings', 'trainer')) {
                $table->dropColumn('trainer');
            }
            
            // Add the new trainer_id column if it doesn't exist
            if (!Schema::hasColumn('trainings', 'trainer_id')) {
                $table->unsignedBigInteger('trainer_id')->nullable()->after('location');
                $table->foreign('trainer_id')->references('id')->on('trainers')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trainings', function (Blueprint $table) {
            // Drop the foreign key and column
            $table->dropForeign(['trainer_id']);
            $table->dropColumn('trainer_id');
            
            // Optionally add back the old trainer column
            $table->string('trainer')->nullable()->after('location');
        });
    }
};