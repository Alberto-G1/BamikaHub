package com.bamikahub.inventorysystem.controllers;

import com.bamikahub.inventorysystem.dao.StatusRepository;
import com.bamikahub.inventorysystem.models.Status;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/statuses")
public class StatusController {

    @Autowired
    private StatusRepository statusRepository;

    @GetMapping
    public List<Status> getAllStatuses() {
        return statusRepository.findAll();
    }
}