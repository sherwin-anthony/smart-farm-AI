<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            FarmSeeder::class,
            PlotSeeder::class,
            CropSeeder::class,
        ]);
    }
}
